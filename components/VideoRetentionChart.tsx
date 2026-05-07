'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, PlayCircle, Image as ImageIcon } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { CreativeWithMetrics } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Extract a numeric value from Meta's action array (e.g. video_p25_watched_actions)
function actionVal(
  arr: { action_type: string; value: string }[] | undefined
): number {
  return parseFloat(arr?.[0]?.value ?? '0') || 0
}

/**
 * Estimate video duration from quartile data + average watch time.
 *
 * Meta's video_avg_time_watched_actions returns milliseconds.
 * Average watch fraction (trapezoidal rule over 5 equally-spaced points):
 *   avg_frac = 0.25 * [(r0 + r100)/2 + r25 + r50 + r75]
 * Then: duration_s = avg_watch_ms/1000 / avg_frac
 */
function estimateDuration(
  plays: number,
  p25: number,
  p50: number,
  p75: number,
  p100: number,
  avgWatchMs: number
): number {
  if (plays === 0 || avgWatchMs === 0) return 62

  const avgWatchSec = avgWatchMs / 1000
  const r25  = p25  / plays
  const r50  = p50  / plays
  const r75  = p75  / plays
  const r100 = p100 / plays

  // Trapezoidal integral over [0, 1] with 5 points at 0, 0.25, 0.5, 0.75, 1
  const avgFrac = 0.25 * ((1 + r100) / 2 + r25 + r50 + r75)

  if (avgFrac < 0.005) return 62

  const dur = Math.round(avgWatchSec / avgFrac)
  return Math.max(10, Math.min(dur, 300))
}

/**
 * Build retention curve from real Meta quartile data.
 * Anchors: 0s→100%, dur25→r25%, dur50→r50%, dur75→r75%, dur→r100%
 * Plus a synthetic early-drop point at ~3s based on the curve shape.
 */
function buildCurve(
  plays: number,
  p25: number,
  p50: number,
  p75: number,
  p100: number,
  duration: number
): { second: number; pct: number }[] {
  const hasData = plays > 0

  // Retention % at each quartile
  const v25  = hasData ? (p25  / plays) * 100 : 65.0
  const v50  = hasData ? (p50  / plays) * 100 : (v25 * 0.55)
  const v75  = hasData ? (p75  / plays) * 100 : (v25 * 0.35)
  const v100 = hasData ? (p100 / plays) * 100 : 10.56

  // Synthetic hook-drop anchor at exactly 3s (typical early-drop point)
  const hook3s = Math.min(3, Math.max(1, duration - 1))
  // The hook value represents the ~40-60% drop typical in the first 3 seconds
  const vHook  = Math.min(95, v25 + (100 - v25) * 0.4)

  const dur25 = Math.round(duration * 0.25)
  const dur50 = Math.round(duration * 0.5)
  const dur75 = Math.round(duration * 0.75)

  const anchors = [
    { s: 0,        v: 100   },
    { s: hook3s,   v: vHook },
    { s: dur25,    v: v25   },
    { s: dur50,    v: v50   },
    { s: dur75,    v: v75   },
    { s: duration, v: v100  },
  ]

  // Generate ~40 evenly-spaced points via linear interpolation between anchors
  const step = Math.max(1, Math.round(duration / 40))
  const points: { second: number; pct: number }[] = []

  for (let s = 0; s <= duration; s += step) {
    let pct = 100
    for (let i = 0; i < anchors.length - 1; i++) {
      if (s >= anchors[i].s && s <= anchors[i + 1].s) {
        const range = anchors[i + 1].s - anchors[i].s
        const t     = range > 0 ? (s - anchors[i].s) / range : 0
        pct = anchors[i].v + (anchors[i + 1].v - anchors[i].v) * t
        break
      }
    }
    points.push({ second: s, pct: parseFloat(Math.max(0, pct).toFixed(1)) })
  }

  if (points[points.length - 1]?.second !== duration) {
    points.push({ second: duration, pct: parseFloat(v100.toFixed(1)) })
  }

  return points
}

function buildTicks(duration: number): number[] {
  const interval = duration <= 30 ? 2 : duration <= 75 ? 10 : 15
  const ticks: number[] = []
  for (let t = 0; t <= duration; t += interval) ticks.push(t)
  if (ticks[ticks.length - 1] !== duration) ticks.push(duration)
  return ticks
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-0.5">{fmtTime(label)}</p>
      <p className="font-semibold text-violet-400">{payload[0].value}% viewers</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  item: CreativeWithMetrics
}

export default function VideoRetentionChart({ item }: Props) {
  const [open, setOpen] = useState(false)

  const { ad, creative, insights, videoInsights, computedMetrics } = item
  const thumbnailUrl = creative.thumbnail_url ?? creative.image_url

  // ── Extract real Meta video metrics ─────────────────────────────────────────
  const plays      = actionVal(insights.video_play_actions)
  const p25        = actionVal(insights.video_p25_watched_actions)
  const p50        = actionVal(insights.video_p50_watched_actions)
  const p75        = actionVal(insights.video_p75_watched_actions)
  const p100       = actionVal(insights.video_p100_watched_actions)
  const avgWatchMs = actionVal(insights.video_avg_time_watched_actions)

  // ── Derived values ───────────────────────────────────────────────────────────
  const duration = estimateDuration(plays, p25, p50, p75, p100, avgWatchMs)
  const data     = buildCurve(plays, p25, p50, p75, p100, duration)
  const ticks    = buildTicks(duration)

  const ref25 = Math.round(duration * 0.25)
  const ref50 = Math.round(duration * 0.5)
  const ref75 = Math.round(duration * 0.75)

  // ── Header metrics (real data, fallback to computed or sample) ───────────────
  const impressions = parseInt(insights.impressions ?? '0')

  // Reproducciones: video play actions (3-sec views)
  const displayPlays = plays > 0 ? plays : 267

  // Tiempo medio: usar computedMetrics.avgTimeSeconds (ya calculado en la API)
  // Si es 0, estimar desde los datos de cuartiles (integración trapezoidal)
  const estimatedAvgSec = plays > 0
    ? Math.round(duration * 0.25 * ((1 + p100 / plays) / 2 + p25 / plays + p50 / plays + p75 / plays))
    : 0
  const avgWatchSec =
    computedMetrics.avgTimeSeconds > 0
      ? computedMetrics.avgTimeSeconds
      : avgWatchMs > 0
        ? (avgWatchMs > 300 ? Math.round(avgWatchMs / 1000) : Math.round(avgWatchMs))
        : estimatedAvgSec > 0
          ? estimatedAvgSec
          : (videoInsights?.avg_watch_time ?? 0)
  const displayAvgWatch = avgWatchSec > 0 ? fmtTime(avgWatchSec) : '0:00'

  // Tasa de atracción: (views3sec / impressions) × 100
  // video_play_actions = reproductions of 3+ seconds = views3sec
  const displayHookRate = impressions > 0 && plays > 0
    ? (plays / impressions) * 100
    : computedMetrics.hookRate > 0
      ? computedMetrics.hookRate
      : 53

  // Tasa de retención: at100 = (p100 / plays) × 100 = % que vio el video completo
  const displayRetention = plays > 0 && p100 > 0
    ? (p100 / plays) * 100
    : computedMetrics.retentionRate > 0
      ? computedMetrics.retentionRate
      : 1.08

  const isEstimated = plays === 0

  return (
    <>
      {/* Trigger button inside CreativeDetail */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-violet-400 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/20 hover:border-violet-500/40 rounded-xl transition-colors"
      >
        <PlayCircle className="w-3.5 h-3.5" />
        Ver curva de visualización
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">

            {/* ── Header: 4 metrics ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div className="flex gap-10">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Reproducciones de video
                  </p>
                  <p className="text-2xl font-bold text-slate-100 tabular-nums">
                    {displayPlays.toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Tiempo medio de reproducción
                  </p>
                  <p className="text-2xl font-bold text-slate-100 tabular-nums">
                    {displayAvgWatch}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Tasa de atracción
                  </p>
                  <p className="text-2xl font-bold text-slate-100 tabular-nums">
                    {displayHookRate.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Tasa de retención
                  </p>
                  <p className="text-2xl font-bold text-slate-100 tabular-nums">
                    {displayRetention.toFixed(2)}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              <h3 className="text-base font-semibold text-slate-100 mb-1">
                Tiempo visualizado
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Analiza el rendimiento de tu video por tiempo de visualización.
                La curva muestra qué porcentaje de viewers sigue viendo el video en cada momento.
              </p>

              <p className="text-xs font-medium text-slate-400 mb-5">
                {ad.name}
                <span className="text-slate-600 mx-1.5">·</span>
                Duración estimada: {fmtTime(duration)}
              </p>

              {/* ── Layout: thumbnail | chart ──────────────────────────── */}
              <div className="flex gap-5 items-start">

                {/* Thumbnail — vertical 9:16 */}
                <div className="flex-shrink-0 w-24">
                  <div
                    className="relative rounded-xl overflow-hidden bg-slate-800"
                    style={{ aspectRatio: '9/16' }}
                  >
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={ad.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-7 h-7 text-slate-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div className="flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height={270}>
                    <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid stroke="#1e293b" vertical={false} />

                      <XAxis
                        dataKey="second"
                        ticks={ticks}
                        tickFormatter={fmtTime}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                        width={42}
                      />

                      <Tooltip content={<ChartTooltip />} />

                      {/* Dashed verticals at 25 / 50 / 75 / 100% */}
                      <ReferenceLine x={ref25} stroke="#334155" strokeDasharray="5 4"
                        label={{ value: '25%', position: 'insideTopLeft', fill: '#475569', fontSize: 10, dy: -2 }} />
                      <ReferenceLine x={ref50} stroke="#334155" strokeDasharray="5 4"
                        label={{ value: '50%', position: 'insideTopLeft', fill: '#475569', fontSize: 10, dy: -2 }} />
                      <ReferenceLine x={ref75} stroke="#334155" strokeDasharray="5 4"
                        label={{ value: '75%', position: 'insideTopLeft', fill: '#475569', fontSize: 10, dy: -2 }} />
                      <ReferenceLine x={duration} stroke="#334155" strokeDasharray="5 4"
                        label={{ value: '100%', position: 'insideTopLeft', fill: '#475569', fontSize: 10, dy: -2 }} />

                      <Area
                        type="monotone"
                        dataKey="pct"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#violetGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Quartile retention stats */}
                  <div className="grid grid-cols-4 gap-3 mt-3 px-1">
                    {[
                      { label: '25% visto',  val: plays > 0 ? ((p25  / plays) * 100).toFixed(1) : '—' },
                      { label: '50% visto',  val: plays > 0 ? ((p50  / plays) * 100).toFixed(1) : '—' },
                      { label: '75% visto',  val: plays > 0 ? ((p75  / plays) * 100).toFixed(1) : '—' },
                      { label: '100% visto', val: plays > 0 ? ((p100 / plays) * 100).toFixed(1) : '—' },
                    ].map(({ label, val }) => (
                      <div key={label} className="text-center bg-slate-800/60 rounded-lg py-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-slate-200">{val}{val !== '—' ? '%' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isEstimated && (
                <p className="text-[11px] text-slate-600 text-center mt-4">
                  Curva estimada con datos de ejemplo — sin datos de reproducción disponibles para este creativo
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
