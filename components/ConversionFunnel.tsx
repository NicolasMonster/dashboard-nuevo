'use client'

import { useState, useEffect } from 'react'
import { formatNumber, formatPercent } from '@/lib/utils'
import type { FunnelData } from '@/lib/types'

interface Stage {
  key: keyof FunnelData
  label: string
  color: string
}

const STAGES: Stage[] = [
  { key: 'linkClicks',       label: 'Clicks únicos en el enlace', color: '#3b82f6' },
  { key: 'viewContent',      label: 'View Content',               color: '#0ea5e9' },
  { key: 'addToCart',        label: 'Add to Cart',                color: '#06b6d4' },
  { key: 'initiateCheckout', label: 'Initiate Checkout',          color: '#10b981' },
  { key: 'purchase',         label: 'Purchase',                   color: '#22c55e' },
]

interface TooltipState {
  label: string
  value: number
  convFromPrev: number | null
  convFromFirst: number | null
  x: number
  y: number
}

interface ConversionFunnelProps {
  data: FunnelData
  loading?: boolean
}

export default function ConversionFunnel({ data, loading }: ConversionFunnelProps) {
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        {[92, 68, 50, 34, 20].map((w, i) => (
          <div
            key={i}
            className="h-7 bg-surface-800 rounded-lg animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    )
  }

  const firstValue = data.linkClicks || 1
  const hasData = STAGES.some((s) => data[s.key] > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
        Sin datos de conversión para el período seleccionado
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex flex-col items-center gap-0">
        {STAGES.map((stage, i) => {
          const value = data[stage.key]
          const prevValue = i === 0 ? null : data[STAGES[i - 1].key]
          const rawPct = (value / firstValue) * 100
          const widthPct = mounted ? Math.max(rawPct, value > 0 ? 10 : 0) : 0
          const convFromPrev =
            prevValue != null && prevValue > 0 ? (value / prevValue) * 100 : null
          const convFromFirst = i > 0 && firstValue > 0 ? (value / firstValue) * 100 : null

          const convColor =
            convFromPrev === null
              ? ''
              : convFromPrev >= 10
              ? 'text-emerald-400'
              : convFromPrev >= 3
              ? 'text-yellow-400'
              : 'text-red-400'

          return (
            <div key={stage.key} className="w-full flex flex-col items-center">
              {/* Connector with conversion rate */}
              {i > 0 && (
                <div className="flex items-center gap-1.5 my-0.5 h-5">
                  <span className="text-slate-700 text-[10px]">▼</span>
                  {convFromPrev !== null && (
                    <span className={`text-[10px] font-semibold tabular-nums ${convColor}`}>
                      {formatPercent(convFromPrev)}
                    </span>
                  )}
                </div>
              )}

              {/* Funnel bar */}
              <div
                className="relative h-8 rounded-lg flex items-center justify-center cursor-pointer hover:brightness-110 transition-[width] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  width: `${widthPct}%`,
                  minWidth: value > 0 ? 96 : 0,
                  backgroundColor: stage.color,
                  opacity: 0.85,
                  transitionDuration: '700ms',
                  transitionDelay: `${i * 80}ms`,
                }}
                onMouseEnter={(e) =>
                  setTooltip({
                    label: stage.label,
                    value,
                    convFromPrev,
                    convFromFirst,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseMove={(e) =>
                  setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
                }
                onMouseLeave={() => setTooltip(null)}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm truncate px-3 select-none">
                  {formatNumber(value)}
                </span>
              </div>

              {/* Stage label */}
              <span className="text-[10px] text-slate-500 mt-1 font-medium select-none">
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-surface-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs pointer-events-none min-w-[200px]"
          style={{ left: tooltip.x + 14, top: tooltip.y - 90 }}
        >
          <p className="font-semibold text-slate-100 mb-2">{tooltip.label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Valor</span>
              <span className="text-slate-200 font-medium tabular-nums">
                {formatNumber(tooltip.value)}
              </span>
            </div>
            {tooltip.convFromPrev !== null && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">vs etapa anterior</span>
                <span className="text-slate-200 font-medium tabular-nums">
                  {formatPercent(tooltip.convFromPrev)}
                </span>
              </div>
            )}
            {tooltip.convFromFirst !== null && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">vs primer etapa</span>
                <span className="text-slate-200 font-medium tabular-nums">
                  {formatPercent(tooltip.convFromFirst)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
