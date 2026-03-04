'use client'

import Image from 'next/image'
import { X, Play, Image as ImageIcon, TrendingUp, DollarSign, Eye, MousePointerClick, Clock, CheckCircle } from 'lucide-react'
import { cn, formatCurrency, formatPercent, formatRoas, getRoasColor, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { CreativeWithMetrics } from '@/lib/types'
import AIAnalysisPanel from './AIAnalysisPanel'

interface CreativeDetailProps {
  item: CreativeWithMetrics
  campaignName: string
  onClose: () => void
}

interface MetricRowProps {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}

function MetricRow({ icon, label, value, valueClass }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn('text-sm font-semibold', valueClass ?? 'text-slate-200')}>
        {value}
      </span>
    </div>
  )
}

export default function CreativeDetail({ item, campaignName, onClose }: CreativeDetailProps) {
  const { ad, creative, computedMetrics, videoInsights } = item
  const thumbnailUrl = creative.thumbnail_url ?? creative.image_url
  const isVideo = creative.object_type === 'VIDEO' || !!creative.video_id

  return (
    <div className="flex flex-col h-full bg-surface-900 border-l border-slate-800 w-96 flex-shrink-0 overflow-y-auto animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 sticky top-0 bg-surface-900 z-10">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{campaignName}</p>
          <h3 className="text-sm font-semibold text-slate-200 truncate">
            {creative.title ?? ad.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-800 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-800">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={creative.title ?? ad.name}
              fill
              className="object-cover"
              sizes="384px"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <ImageIcon className="w-10 h-10 mb-2" />
              <p className="text-xs">Sin preview</p>
            </div>
          )}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Status + Type */}
        <div className="flex items-center gap-2">
          <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(ad.status))}>
            {getStatusLabel(ad.status)}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400 font-medium">
            {isVideo ? 'Video' : 'Imagen'}
          </span>
        </div>

        {/* Creative Copy */}
        {(creative.title || creative.body) && (
          <div className="bg-surface-800 rounded-xl p-4 space-y-2">
            {creative.title && (
              <p className="text-sm font-semibold text-slate-200">{creative.title}</p>
            )}
            {creative.body && (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">{creative.body}</p>
            )}
            {creative.call_to_action_type && (
              <span className="inline-block text-xs px-2 py-1 bg-brand-600/20 text-brand-400 rounded-md font-medium">
                {creative.call_to_action_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="bg-surface-800 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Rendimiento
          </h4>
          <MetricRow
            icon={<TrendingUp className="w-4 h-4" />}
            label="ROAS"
            value={formatRoas(computedMetrics.roas)}
            valueClass={getRoasColor(computedMetrics.roas)}
          />
          <MetricRow
            icon={<DollarSign className="w-4 h-4" />}
            label="Revenue"
            value={formatCurrency(computedMetrics.revenue)}
            valueClass="text-brand-400"
          />
          <MetricRow
            icon={<DollarSign className="w-4 h-4" />}
            label="Gastado"
            value={formatCurrency(computedMetrics.spend)}
          />
          <MetricRow
            icon={<Eye className="w-4 h-4" />}
            label="Impresiones"
            value={computedMetrics.impressions.toLocaleString('es-AR')}
          />
          <MetricRow
            icon={<MousePointerClick className="w-4 h-4" />}
            label="CTR"
            value={formatPercent(computedMetrics.ctr)}
          />
          <MetricRow
            icon={<MousePointerClick className="w-4 h-4" />}
            label="Clics"
            value={computedMetrics.clicks.toLocaleString('es-AR')}
          />
        </div>

        {/* Video Metrics */}
        {isVideo && videoInsights && (
          <div className="bg-surface-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Métricas de Video
            </h4>
            {videoInsights.total_video_views !== undefined && (
              <MetricRow
                icon={<Eye className="w-4 h-4" />}
                label="Total Views"
                value={(videoInsights.total_video_views ?? 0).toLocaleString('es-AR')}
              />
            )}
            {videoInsights.completion_rate !== undefined && (
              <MetricRow
                icon={<CheckCircle className="w-4 h-4" />}
                label="Completion Rate"
                value={formatPercent((videoInsights.completion_rate ?? 0) * 100)}
              />
            )}
            {videoInsights.avg_watch_time !== undefined && (
              <MetricRow
                icon={<Clock className="w-4 h-4" />}
                label="Avg Watch Time"
                value={`${(videoInsights.avg_watch_time ?? 0).toFixed(1)}s`}
              />
            )}
          </div>
        )}

        {/* AI Analysis */}
        <AIAnalysisPanel item={item} campaignName={campaignName} />
      </div>
    </div>
  )
}
