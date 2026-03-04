import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('es-AR')
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-emerald-400 bg-emerald-400/10'
    case 'PAUSED':
      return 'text-yellow-400 bg-yellow-400/10'
    case 'ARCHIVED':
    case 'DELETED':
      return 'text-slate-400 bg-slate-400/10'
    default:
      return 'text-slate-400 bg-slate-400/10'
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    ARCHIVED: 'Archivada',
    DELETED: 'Eliminada',
  }
  return labels[status] ?? status
}

export function getRoasColor(roas: number): string {
  if (roas >= 4) return 'text-emerald-400'
  if (roas >= 2) return 'text-yellow-400'
  return 'text-red-400'
}
