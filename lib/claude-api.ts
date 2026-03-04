import OpenAI from 'openai'
import type { AIAnalysisRequest, AIAnalysisResponse } from './types'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeCreative(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  const { creative, insights, videoInsights, campaignName, adSetName } = request

  const spend = parseFloat(insights.spend ?? '0')
  const impressions = parseInt(insights.impressions ?? '0')
  const clicks = parseInt(insights.clicks ?? '0')
  const ctr = parseFloat(insights.ctr ?? '0')
  const roas =
    insights.purchase_roas?.find((r) => r.action_type === 'omni_purchase')?.value ??
    insights.purchase_roas?.find((r) => r.action_type === 'purchase')?.value ??
    '0'
  const revenue =
    insights.action_values?.find((a) => a.action_type === 'omni_purchase')?.value ??
    insights.action_values?.find((a) => a.action_type === 'purchase')?.value ??
    '0'

  const systemPrompt = `Eres un experto en performance marketing digital con más de 10 años de experiencia en Meta Ads (Facebook/Instagram).
Analizás creativos publicitarios basándote en métricas de rendimiento y brindás diagnósticos precisos, recomendaciones accionables y proyecciones realistas.
Respondés siempre en español, de forma directa y profesional.
Respondés ÚNICAMENTE con JSON válido, sin texto adicional antes ni después.`

  const userPrompt = `Analizá este creativo publicitario de Meta Ads y devolvé un JSON con el siguiente esquema exacto:

{
  "diagnosis": "string - diagnóstico del rendimiento (2-3 párrafos)",
  "recommendations": ["array de 3-5 recomendaciones específicas y accionables"],
  "projections": "string - proyecciones si se implementan las recomendaciones",
  "score": número del 1 al 10,
  "strengths": ["array de 2-4 puntos fuertes del creativo"],
  "weaknesses": ["array de 2-4 puntos débiles o áreas de mejora"]
}

DATOS DEL CREATIVO:
- Campaña: ${campaignName}
- Ad Set: ${adSetName ?? 'N/A'}
- Tipo: ${creative.object_type ?? 'Desconocido'}
- Título: ${creative.title ?? 'Sin título'}
- Cuerpo: ${creative.body ?? 'Sin descripción'}
- CTA: ${creative.call_to_action_type ?? 'Sin CTA'}

MÉTRICAS DE RENDIMIENTO (período analizado):
- Gasto: $${spend.toFixed(2)}
- Impresiones: ${impressions.toLocaleString('es-AR')}
- Clics: ${clicks.toLocaleString('es-AR')}
- CTR: ${ctr.toFixed(2)}%
- ROAS: ${parseFloat(roas).toFixed(2)}x
- Revenue generado: $${parseFloat(revenue).toFixed(2)}
${
  videoInsights
    ? `
MÉTRICAS DE VIDEO:
- Total de views: ${videoInsights.total_video_views?.toLocaleString('es-AR') ?? 'N/A'}
- Completion rate: ${videoInsights.completion_rate ? (videoInsights.completion_rate * 100).toFixed(1) + '%' : 'N/A'}
- Avg watch time: ${videoInsights.avg_watch_time ? videoInsights.avg_watch_time.toFixed(1) + 's' : 'N/A'}
`
    : ''
}

Recordá: respondé SOLO con el JSON, sin explicaciones adicionales.`

  const response = await client.chat.completions.create({
    model: 'gpt-5.2',
    max_completion_tokens: 1500,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from OpenAI')
  }

  try {
    return JSON.parse(content) as AIAnalysisResponse
  } catch {
    throw new Error('Failed to parse OpenAI response as JSON')
  }
}
