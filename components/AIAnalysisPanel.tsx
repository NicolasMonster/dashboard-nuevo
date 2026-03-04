'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreativeWithMetrics, AIAnalysisResponse } from '@/lib/types'

interface AIAnalysisPanelProps {
  item: CreativeWithMetrics
  campaignName: string
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 7 ? 'bg-emerald-400' : score >= 4 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-700 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-700', color)}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span
        className={cn(
          'text-lg font-bold w-8 text-right',
          score >= 7 ? 'text-emerald-400' : score >= 4 ? 'text-yellow-400' : 'text-red-400'
        )}
      >
        {score}
      </span>
    </div>
  )
}

export default function AIAnalysisPanel({ item, campaignName }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setAnalysis(null)

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

      const data = (await res.json()) as AIAnalysisResponse
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-surface-800 to-surface-900 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <h4 className="text-sm font-semibold text-slate-200">Análisis IA</h4>
        </div>
        {analysis && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Trigger Button */}
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analizar con Claude
          </button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Claude está analizando el creativo...</p>
            </div>
            <div className="space-y-2">
              {[80, 60, 70].map((w, i) => (
                <div key={i} className={`h-3 bg-surface-800 rounded animate-pulse`} style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={handleAnalyze}
                className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && expanded && (
          <div className="space-y-4 animate-fade-in">
            {/* Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                  Score del creativo
                </p>
                <span className="text-xs text-slate-500">/10</span>
              </div>
              <ScoreBar score={analysis.score} />
            </div>

            {/* Diagnosis */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Diagnóstico
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">{analysis.diagnosis}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 gap-3">
              {analysis.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Fortalezas
                  </p>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Debilidades
                  </p>
                  <ul className="space-y-1">
                    {analysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Recomendaciones
                </p>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-300 flex items-start gap-2 bg-surface-900/50 rounded-lg p-2"
                    >
                      <span className="bg-yellow-400/20 text-yellow-400 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 font-bold text-[10px] mt-0.5">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projections */}
            {analysis.projections && (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-brand-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Proyecciones
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.projections}</p>
              </div>
            )}

            {/* Re-analyze button */}
            <button
              onClick={handleAnalyze}
              className="w-full border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Nuevo análisis
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
