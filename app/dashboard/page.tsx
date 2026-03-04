'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, BarChart2, Zap, Layers } from 'lucide-react'
import { subDays, format } from 'date-fns'
import CampaignSidebar from '@/components/CampaignSidebar'
import KPICards from '@/components/KPICards'
import { RoasLineChart, SalesBarChart } from '@/components/Charts'
import CreativeGrid from '@/components/CreativeGrid'
import CreativeDetail from '@/components/CreativeDetail'
import DateRangePicker from '@/components/DateRangePicker'
import ConversionFunnel from '@/components/ConversionFunnel'
import { cn } from '@/lib/utils'
import type { Campaign, CreativeWithMetrics, DateFilter, DashboardData, FunnelData } from '@/lib/types'

function defaultFilter(): DateFilter {
  const today = new Date()
  const start = subDays(today, 29)
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    label: 'Últimos 30 días',
  }
}

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(defaultFilter)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null)

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const [creatives, setCreatives] = useState<CreativeWithMetrics[]>([])
  const [loadingCreatives, setLoadingCreatives] = useState(false)

  const [selectedCreative, setSelectedCreative] = useState<CreativeWithMetrics | null>(null)

  // ── Fetch dashboard data ──────────────────────────────────────────────────
  const fetchDashboard = useCallback(
    async (filter: DateFilter) => {
      setLoadingDashboard(true)
      setErrorDashboard(null)
      try {
        const res = await fetch(
          `/api/campaigns?startDate=${filter.startDate}&endDate=${filter.endDate}`
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Error ${res.status}`)
        }
        const data = (await res.json()) as DashboardData
        setDashboardData(data)
      } catch (err) {
        setErrorDashboard(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setLoadingDashboard(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    fetchDashboard(dateFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter])

  // ── Fetch creatives for a specific campaign ───────────────────────────────
  const fetchCreatives = useCallback(
    async (campaignId: string, filter: DateFilter) => {
      setLoadingCreatives(true)
      setSelectedCreative(null)
      try {
        const params = new URLSearchParams({
          campaignId,
          startDate: filter.startDate,
          endDate: filter.endDate,
        })
        const res = await fetch(`/api/creatives?${params}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Error ${res.status}`)
        }
        const data = await res.json()
        setCreatives(data.creatives ?? [])
      } catch (err) {
        console.error('Failed to load creatives:', err)
        setCreatives([])
      } finally {
        setLoadingCreatives(false)
      }
    },
    []
  )

  // Fetch creatives only when a campaign is selected
  useEffect(() => {
    if (selectedCampaignId) {
      fetchCreatives(selectedCampaignId, dateFilter)
    } else {
      setCreatives([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, dateFilter])

  function handleSelectCampaign(id: string) {
    setSelectedCampaignId(id)
    const campaign = dashboardData?.campaigns.find((c) => c.id === id) ?? null
    setSelectedCampaign(campaign)
    setSelectedCreative(null)
  }

  function handleDateChange(filter: DateFilter) {
    setDateFilter(filter)
  }

  const kpis = dashboardData?.totalKPIs ?? {
    totalSpend: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgRoas: 0,
    avgCtr: 0,
  }

  const emptyFunnel: FunnelData = {
    impressions: 0,
    clicks: 0,
    linkClicks: 0,
    viewContent: 0,
    addToCart: 0,
    initiateCheckout: 0,
    purchase: 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Sidebar */}
      <CampaignSidebar
        campaigns={dashboardData?.campaigns ?? []}
        selectedCampaignId={selectedCampaignId}
        onSelectCampaign={handleSelectCampaign}
        loading={loadingDashboard}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-surface-900 flex-shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-brand-600/20 p-2 rounded-lg flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-brand-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 leading-tight">Meta Ads Dashboard</h1>
              <p className="text-xs text-slate-500 truncate">
                {selectedCampaign ? selectedCampaign.name : 'Seleccioná una campaña'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Date Range Picker */}
            <DateRangePicker value={dateFilter} onChange={handleDateChange} />

            {/* Refresh */}
            <button
              onClick={() => fetchDashboard(dateFilter)}
              disabled={loadingDashboard}
              className="p-2 rounded-lg bg-surface-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw className={cn('w-4 h-4', loadingDashboard && 'animate-spin')} />
            </button>
          </div>
        </header>

        {/* Content + Detail Panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scrollable main area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Error Banner */}
              {errorDashboard && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      Error al conectar con Meta API
                    </p>
                    <p className="text-xs text-red-400/70 mt-0.5">{errorDashboard}</p>
                  </div>
                  <button
                    onClick={() => fetchDashboard(dateFilter)}
                    className="ml-auto text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {/* KPI Cards */}
              <KPICards {...kpis} loading={loadingDashboard} />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand-400 rounded-full" />
                    ROAS en el tiempo
                  </h3>
                  <RoasLineChart
                    data={dashboardData?.roasOverTime ?? []}
                    loading={loadingDashboard}
                  />
                </div>
                <div className="bg-surface-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full" />
                    Revenue vs Inversión
                  </h3>
                  <SalesBarChart
                    data={dashboardData?.roasOverTime ?? []}
                    loading={loadingDashboard}
                  />
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-surface-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  Funnel de Conversión
                  <span className="text-xs text-slate-500 font-normal ml-1">
                    — cuenta completa
                  </span>
                </h3>
                <ConversionFunnel
                  data={dashboardData?.funnelData ?? emptyFunnel}
                  loading={loadingDashboard}
                />
              </div>

              {/* Creatives */}
              <div className="bg-surface-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full" />
                    Creativos
                    {creatives.length > 0 && (
                      <span className="text-xs text-slate-500 font-normal">
                        ({creatives.length})
                      </span>
                    )}
                  </h3>
                  {loadingCreatives && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Cargando creativos...
                    </div>
                  )}
                </div>

                {!selectedCampaignId ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-500">
                    <Layers className="w-10 h-10 opacity-20" />
                    <p className="text-sm">Seleccioná una campaña para ver sus creativos</p>
                  </div>
                ) : (
                  <CreativeGrid
                    creatives={creatives}
                    selectedCreativeId={selectedCreative?.ad.id ?? null}
                    onSelectCreative={setSelectedCreative}
                    campaignName={selectedCampaign?.name ?? ''}
                    loading={loadingCreatives}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Creative Detail Panel */}
          {selectedCreative && (
            <CreativeDetail
              item={selectedCreative}
              campaignName={selectedCampaign?.name ?? ''}
              onClose={() => setSelectedCreative(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
