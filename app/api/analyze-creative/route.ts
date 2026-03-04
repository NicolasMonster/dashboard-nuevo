import { NextRequest, NextResponse } from 'next/server'
import { analyzeCreative } from '@/lib/claude-api'
import type { AIAnalysisRequest } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as AIAnalysisRequest

    if (!body.creative || !body.insights) {
      return NextResponse.json(
        { error: 'creative and insights are required' },
        { status: 400 }
      )
    }

    const analysis = await analyzeCreative(body)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('[/api/analyze-creative] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze creative',
      },
      { status: 500 }
    )
  }
}
