'use client'

import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import { cn, formatCurrency, formatRoas, getStatusColor, getStatusLabel, getRoasColor } from '@/lib/utils'
import type { Campaign } from '@/lib/types'

interface CampaignSidebarProps {
  campaigns: Campaign[]
  selectedCampaignId: string | null
  onSelectCampaign: (id: string) => void
  loading?: boolean
}

export default function CampaignSidebar({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  loading,
}: CampaignSidebarProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL')

  const filtered = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <aside className="flex flex-col w-72 min-h-0 bg-surface-900 border-r border-slate-800">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Campañas
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar campaña..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1">
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md font-medium transition-colors',
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-800 text-slate-400 hover:text-slate-200'
              )}
            >
              {s === 'ALL' ? 'Todas' : s === 'ACTIVE' ? 'Activas' : 'Pausadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-800 rounded-lg animate-pulse mx-2" />
          ))
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8 px-4">
            No se encontraron campañas
          </p>
        ) : (
          filtered.map((campaign) => {
            const roas = campaign.insights?.roas ?? 0
            const spend = campaign.insights?.spend ?? 0
            const isSelected = campaign.id === selectedCampaignId

            return (
              <button
                key={campaign.id}
                onClick={() => onSelectCampaign(campaign.id)}
                className={cn(
                  'w-full text-left px-3 py-3 rounded-lg transition-all group',
                  isSelected
                    ? 'bg-brand-600/20 border border-brand-500/30'
                    : 'hover:bg-surface-800 border border-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate leading-tight">
                      {campaign.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full font-medium',
                          getStatusColor(campaign.status)
                        )}
                      >
                        {getStatusLabel(campaign.status)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 mt-0.5 flex-shrink-0 transition-colors',
                      isSelected ? 'text-brand-400' : 'text-slate-600 group-hover:text-slate-400'
                    )}
                  />
                </div>

                {campaign.insights ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">ROAS</p>
                      <p className={cn('text-sm font-semibold', getRoasColor(roas))}>
                        {formatRoas(roas)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Gastado</p>
                      <p className="text-sm font-medium text-slate-300">
                        {formatCurrency(spend)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {roas >= 3 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : roas >= 1.5 ? (
                        <Minus className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-600">Sin datos en el período</p>
                )}
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}
