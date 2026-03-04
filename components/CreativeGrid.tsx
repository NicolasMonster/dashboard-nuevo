'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Play,
  Image as ImageIcon,
  Zap,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { cn, formatCurrency, formatPercent, formatRoas, getRoasColor } from '@/lib/utils'
import type { CreativeWithMetrics, AIAnalysisResponse } from '@/lib/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreativeGridProps {
  creatives: CreativeWithMetrics[]
  selectedCreativeId: string | null
  onSelectCreative: (creative: CreativeWithMetrics) => void
  campaignName?: string
  loading?: boolean
}

// ─── MetricPill ───────────────────────────────────────────────────────────────

interface MetricPillProps {
  label: string
  value: string
  highlight?: boolean
}

function MetricPill({ label, value, highlight }: MetricPillProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-slate-500 uppercase tracking-wide leading-none mb-0.5">
        {label}
      </span>
      <span
        className={cn(
          'text-xs font-semibold leading-none',
          highlight ? 'text-brand-400' : 'text-slate-200'
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ─── AI Analysis Modal ────────────────────────────────────────────────────────

interface AIAnalysisModalProps {
  item: CreativeWithMetrics
  campaignName: string
  onClose: () => void
}

function AIAnalysisModal({ item, campaignName, onClose }: AIAnalysisModalProps) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AIAnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const displayName = item.creative.title ?? item.creative.name ?? item.ad.name

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch('/api/analyze-creative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creative: item.creative,
            insights: item.insights,
            videoInsights: item.videoInsights,
            campaignName,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? `Error ${res.status}`)
        }
        setResult(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al analizar')
      } finally {
        setLoading(false)
      }
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const score = result?.score ?? 0
  const scoreColor =
    score >= 7 ? 'text-emerald-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-brand-600/20 p-1.5 rounded-lg flex-shrink-0">
              <Zap className="w-4 h-4 text-brand-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 leading-tight">Análisis IA</p>
              <p className="text-xs text-slate-500 truncate">{displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-slate-400">Analizando creativo con Claude...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Score + Diagnosis */}
              <div className="flex gap-3 p-3 bg-surface-800 rounded-xl">
                <div className="flex-shrink-0 text-center w-12">
                  <p className={`text-3xl font-black tabular-nums ${scoreColor}`}>{result.score}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide">Score</p>
                </div>
                <div className="w-px bg-slate-700 flex-shrink-0" />
                <p className="text-xs text-slate-300 leading-relaxed flex-1">{result.diagnosis}</p>
              </div>

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fortalezas
                  </p>
                  <ul className="space-y-1.5">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
                        <span className="text-emerald-500 flex-shrink-0 mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {result.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Áreas de mejora
                  </p>
                  <ul className="space-y-1.5">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
                        <span className="text-red-500 flex-shrink-0 mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-400 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Recomendaciones
                  </p>
                  <ol className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
                        <span className="text-brand-400 font-bold flex-shrink-0 mt-0.5 w-4">
                          {i + 1}.
                        </span>
                        {r}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Projections */}
              {result.projections && (
                <div className="p-3 bg-brand-600/10 border border-brand-600/20 rounded-xl">
                  <p className="text-xs font-semibold text-brand-300 mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Proyecciones
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.projections}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CreativeGrid ─────────────────────────────────────────────────────────────

export default function CreativeGrid({
  creatives,
  selectedCreativeId,
  onSelectCreative,
  campaignName = '',
  loading,
}: CreativeGridProps) {
  const [analysisTarget, setAnalysisTarget] = useState<CreativeWithMetrics | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-800 rounded-xl overflow-hidden animate-pulse border border-slate-800"
          >
            <div className="aspect-video bg-slate-800" />
            <div className="p-3 space-y-3">
              <div className="h-3 bg-slate-700 rounded w-3/4" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-6 bg-slate-700 rounded" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!creatives.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No hay creativos para esta campaña en el período seleccionado</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {creatives.map((item) => {
          const { ad, creative, computedMetrics } = item
          const isSelected = ad.id === selectedCreativeId
          const isVideo = creative.object_type === 'VIDEO' || !!creative.video_id
          const thumbnailUrl = creative.thumbnail_url ?? creative.image_url
          const displayName = creative.title ?? creative.name ?? ad.name

          return (
            <button
              key={ad.id}
              onClick={() => onSelectCreative(item)}
              className={cn(
                'text-left bg-surface-900 rounded-xl overflow-hidden border transition-all group',
                'hover:shadow-lg hover:shadow-black/30',
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              )}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-surface-800 overflow-hidden">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={displayName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                    <p className="text-xs text-slate-600 px-3 text-center line-clamp-2">
                      {displayName}
                    </p>
                  </div>
                )}

                {/* Video badge */}
                {isVideo && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Play className="w-3 h-3 text-white fill-white" />
                    <span className="text-[10px] text-white font-medium">Video</span>
                  </div>
                )}

                {/* Status dot */}
                <div
                  className={cn(
                    'absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-surface-900',
                    ad.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-yellow-400'
                  )}
                />

                {/* ROAS badge */}
                <div className="absolute bottom-2 left-2">
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm',
                      getRoasColor(computedMetrics.roas)
                    )}
                  >
                    {formatRoas(computedMetrics.roas)}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2.5">
                {/* Name */}
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {displayName}
                </p>

                {/* Primary metrics */}
                <div className="grid grid-cols-4 gap-2 bg-surface-800 rounded-lg p-2">
                  <MetricPill
                    label="Hook%"
                    value={
                      computedMetrics.hookRate > 0 ? formatPercent(computedMetrics.hookRate) : '—'
                    }
                    highlight={computedMetrics.hookRate > 0}
                  />
                  <MetricPill
                    label="Ret%"
                    value={
                      computedMetrics.retentionRate > 0
                        ? formatPercent(computedMetrics.retentionRate)
                        : '—'
                    }
                    highlight={computedMetrics.retentionRate > 0}
                  />
                  <MetricPill label="CTR" value={formatPercent(computedMetrics.ctr)} />
                  <MetricPill
                    label="Clicks"
                    value={computedMetrics.clicks.toLocaleString('es-AR')}
                  />
                </div>

                {/* Secondary metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricPill label="Spend" value={formatCurrency(computedMetrics.spend)} />
                  <MetricPill
                    label="CPC"
                    value={computedMetrics.cpc > 0 ? formatCurrency(computedMetrics.cpc) : '—'}
                  />
                  <MetricPill
                    label="CPM"
                    value={computedMetrics.cpm > 0 ? formatCurrency(computedMetrics.cpm) : '—'}
                  />
                </div>

                {/* AI Analysis button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAnalysisTarget(item)
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-brand-400 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-600/20 hover:border-brand-500/40 rounded-lg transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Analizar con IA
                </button>
              </div>
            </button>
          )
        })}
      </div>

      {/* AI Analysis Modal */}
      {analysisTarget && (
        <AIAnalysisModal
          item={analysisTarget}
          campaignName={campaignName}
          onClose={() => setAnalysisTarget(null)}
        />
      )}
    </>
  )
}
