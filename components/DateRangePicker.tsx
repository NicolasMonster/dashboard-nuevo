'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  subDays,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  isAfter,
  isBefore,
  startOfToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { DateFilter } from '@/lib/types'

interface DateRangePickerProps {
  value: DateFilter
  onChange: (filter: DateFilter) => void
}

interface Shortcut {
  label: string
  getRange: () => { startDate: Date; endDate: Date; label: string }
}

function getShortcuts(): Shortcut[] {
  return [
    {
      label: 'Hoy',
      getRange: () => {
        const today = startOfToday()
        return { startDate: today, endDate: today, label: 'Hoy' }
      },
    },
    {
      label: 'Últimos 7 días',
      getRange: () => {
        const today = startOfToday()
        return { startDate: subDays(today, 6), endDate: today, label: 'Últimos 7 días' }
      },
    },
    {
      label: 'Últimos 30 días',
      getRange: () => {
        const today = startOfToday()
        return { startDate: subDays(today, 29), endDate: today, label: 'Últimos 30 días' }
      },
    },
    {
      label: 'Este mes',
      getRange: () => {
        const now = new Date()
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
          label: 'Este mes',
        }
      },
    },
    {
      label: 'Mes anterior',
      getRange: () => {
        const prev = subMonths(new Date(), 1)
        return {
          startDate: startOfMonth(prev),
          endDate: endOfMonth(prev),
          label: 'Mes anterior',
        }
      },
    },
  ]
}

function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days: Date[] = []
  let current = start
  while (!isAfter(current, end)) {
    days.push(current)
    current = addDays(current, 1)
  }
  return days
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    if (value.startDate) {
      return startOfMonth(new Date(value.startDate + 'T00:00:00'))
    }
    return startOfMonth(subDays(new Date(), 29))
  })

  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [tempStart, setTempStart] = useState<Date | null>(() =>
    value.startDate ? new Date(value.startDate + 'T00:00:00') : null
  )
  const [tempEnd, setTempEnd] = useState<Date | null>(() =>
    value.endDate ? new Date(value.endDate + 'T00:00:00') : null
  )
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    const start = value.startDate ? new Date(value.startDate + 'T00:00:00') : null
    const end = value.endDate ? new Date(value.endDate + 'T00:00:00') : null
    setTempStart(start)
    setTempEnd(end)
    setSelecting('start')
    if (start) setLeftMonth(startOfMonth(start))
    setOpen(true)
  }

  function handleDayClick(day: Date) {
    if (selecting === 'start') {
      setTempStart(day)
      setTempEnd(null)
      setSelecting('end')
    } else {
      if (tempStart && isBefore(day, tempStart)) {
        setTempEnd(tempStart)
        setTempStart(day)
      } else {
        setTempEnd(day)
      }
      setSelecting('start')
    }
  }

  function handleApply() {
    if (!tempStart || !tempEnd) return
    const label = `${format(tempStart, 'dd/MM/yyyy')} — ${format(tempEnd, 'dd/MM/yyyy')}`
    onChange({
      startDate: format(tempStart, 'yyyy-MM-dd'),
      endDate: format(tempEnd, 'yyyy-MM-dd'),
      label,
    })
    setOpen(false)
  }

  function handleShortcut(shortcut: Shortcut) {
    const { startDate, endDate, label } = shortcut.getRange()
    setTempStart(startDate)
    setTempEnd(endDate)
    setSelecting('start')
    setLeftMonth(startOfMonth(startDate))
    // Apply immediately
    onChange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      label,
    })
    setOpen(false)
  }

  function rangeEnd(): Date | null {
    if (tempEnd) return tempEnd
    if (selecting === 'end' && hoverDate) return hoverDate
    return null
  }

  function isDayInRange(day: Date): boolean {
    if (!tempStart) return false
    const end = rangeEnd()
    if (!end) return false
    const [from, to] = isAfter(tempStart, end) ? [end, tempStart] : [tempStart, end]
    try {
      return isWithinInterval(day, { start: from, end: to })
    } catch {
      return false
    }
  }

  function isDayStart(day: Date): boolean {
    return !!tempStart && isSameDay(day, tempStart)
  }

  function isDayEnd(day: Date): boolean {
    const end = rangeEnd()
    return !!end && isSameDay(day, end)
  }

  const rightMonth = addMonths(leftMonth, 1)

  function renderMonth(month: Date) {
    const days = getCalendarDays(month)
    const isLeft = isSameMonth(month, leftMonth)

    return (
      <div className="w-[220px]">
        {/* Month header */}
        <div className="flex items-center justify-between mb-2">
          {isLeft ? (
            <button
              onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <span className="text-sm font-semibold text-slate-200 capitalize">
            {format(month, 'MMMM yyyy', { locale: es })}
          </span>
          {!isLeft ? (
            <button
              onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-slate-500 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, month)
            const isStart = isDayStart(day)
            const isEnd = isDayEnd(day)
            const inRange = isDayInRange(day)
            const isToday = isSameDay(day, startOfToday())

            return (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-center h-8',
                  inRange && !isStart && !isEnd && 'bg-brand-600/15',
                  isStart && inRange && 'bg-brand-600/15 rounded-l-full',
                  isEnd && inRange && 'bg-brand-600/15 rounded-r-full',
                  isStart && !inRange && 'rounded-full',
                  isEnd && !inRange && 'rounded-full',
                )}
              >
                <button
                  onClick={() => isCurrentMonth && handleDayClick(day)}
                  onMouseEnter={() => isCurrentMonth && setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={cn(
                    'w-7 h-7 text-xs rounded-full flex items-center justify-center transition-all',
                    !isCurrentMonth && 'opacity-25 cursor-default pointer-events-none',
                    isStart || isEnd
                      ? 'bg-brand-600 text-white font-bold shadow-lg shadow-brand-600/30'
                      : inRange
                      ? 'text-brand-300'
                      : isCurrentMonth
                      ? 'text-slate-200 hover:bg-slate-700'
                      : 'text-slate-600',
                    isToday && !isStart && !isEnd && 'ring-1 ring-slate-500',
                  )}
                >
                  {format(day, 'd')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const displayLabel =
    value.label ??
    (value.startDate && value.endDate
      ? `${format(new Date(value.startDate + 'T00:00:00'), 'dd/MM/yyyy')} — ${format(new Date(value.endDate + 'T00:00:00'), 'dd/MM/yyyy')}`
      : 'Seleccionar período')

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-surface-800 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors whitespace-nowrap"
      >
        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span>{displayLabel}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-surface-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 p-4 flex gap-4">
          {/* Shortcuts */}
          <div className="flex flex-col gap-0.5 border-r border-slate-800 pr-4 min-w-[130px]">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2 px-2">
              Acceso rápido
            </p>
            {getShortcuts().map((s) => (
              <button
                key={s.label}
                onClick={() => handleShortcut(s)}
                className="text-left text-sm text-slate-300 hover:text-white hover:bg-surface-800 px-2 py-1.5 rounded-lg transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Calendars + actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-5">
              {renderMonth(leftMonth)}
              {renderMonth(rightMonth)}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <p className="text-xs text-slate-500">
                {selecting === 'start' ? (
                  'Seleccioná fecha de inicio'
                ) : tempStart ? (
                  <>
                    Desde{' '}
                    <span className="text-brand-400 font-medium">
                      {format(tempStart, 'dd/MM/yyyy')}
                    </span>{' '}
                    — seleccioná fin
                  </>
                ) : null}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={!tempStart || !tempEnd}
                  className="px-3 py-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
