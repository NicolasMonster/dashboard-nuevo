'use client'

import { DollarSign, TrendingUp, MousePointerClick, Eye } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent, formatRoas } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface KPI {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

interface KPICardsProps {
  totalSpend: number
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  avgRoas: number
  avgCtr: number
  loading?: boolean
}

export default function KPICards({
  totalSpend,
  totalRevenue,
  totalImpressions,
  totalClicks,
  avgRoas,
  avgCtr,
  loading,
}: KPICardsProps) {
  const kpis: KPI[] = [
    {
      label: 'ROAS',
      value: formatRoas(avgRoas),
      subValue: avgRoas >= 3 ? 'Buen rendimiento' : avgRoas >= 1.5 ? 'Rendimiento medio' : 'Bajo rendimiento',
      icon: <TrendingUp className="w-5 h-5" />,
      color: avgRoas >= 3 ? 'text-emerald-400' : avgRoas >= 1.5 ? 'text-yellow-400' : 'text-red-400',
      bgColor: avgRoas >= 3 ? 'bg-emerald-400/10' : avgRoas >= 1.5 ? 'bg-yellow-400/10' : 'bg-red-400/10',
    },
    {
      label: 'Revenue',
      value: formatCurrency(totalRevenue),
      subValue: `Inversión: ${formatCurrency(totalSpend)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-brand-400',
      bgColor: 'bg-brand-400/10',
    },
    {
      label: 'Gastado',
      value: formatCurrency(totalSpend),
      subValue: `${formatNumber(totalImpressions)} impresiones`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'CTR',
      value: formatPercent(avgCtr),
      subValue: `${formatNumber(totalClicks)} clics`,
      icon: <MousePointerClick className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      label: 'Impresiones',
      value: formatNumber(totalImpressions),
      subValue: 'Alcance total',
      icon: <Eye className="w-5 h-5" />,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface-900 rounded-xl p-5 animate-pulse h-28 border border-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-surface-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {kpi.label}
            </p>
            <span className={cn('p-1.5 rounded-lg', kpi.bgColor, kpi.color)}>
              {kpi.icon}
            </span>
          </div>
          <p className={cn('text-2xl font-bold tracking-tight', kpi.color)}>
            {kpi.value}
          </p>
          {kpi.subValue && (
            <p className="text-xs text-slate-500 mt-1 truncate">{kpi.subValue}</p>
          )}
        </div>
      ))}
    </div>
  )
}
