import { NextRequest, NextResponse } from 'next/server'
import { getAds, computeRoas, computeRevenue } from '@/lib/meta-api'
import type { DateFilter, CreativeWithMetrics, AdInsights } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const campaignId = sp.get('campaignId')
    const startDate = sp.get('startDate')
    const endDate = sp.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const filter: DateFilter = { startDate, endDate }
    const ads = await getAds(campaignId, filter)

    const creativesWithMetrics: CreativeWithMetrics[] = ads.map((ad) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (ad.insights as unknown as { data?: AdInsights[] } & any)?.data?.[0] as
        | AdInsights
        | undefined

      const safeInsights: AdInsights = raw ?? {
        spend: '0',
        impressions: '0',
        clicks: '0',
        ctr: '0',
        date_start: startDate,
        date_stop: endDate,
      }

      const videoPlays = parseInt(safeInsights.video_play_actions?.[0]?.value ?? '0')
      const videoCompletions = parseInt(safeInsights.video_p100_watched_actions?.[0]?.value ?? '0')
      const impressions = parseInt(safeInsights.impressions ?? '0')
      const clicks = parseInt(safeInsights.clicks ?? '0')
      const spend = parseFloat(safeInsights.spend ?? '0')
      const ctr = parseFloat(safeInsights.ctr ?? '0')
      const cpc = parseFloat(safeInsights.cpc ?? '0')
      const cpm = parseFloat(safeInsights.cpm ?? '0')

      const hookRate = impressions > 0 ? (videoPlays / impressions) * 100 : 0
      const retentionRate = videoPlays > 0 ? (videoCompletions / videoPlays) * 100 : 0
      // Completion rate calculado desde los insights (sin llamada extra a Meta API)
      const completionRate = videoPlays > 0 ? videoCompletions / videoPlays : undefined

      const creative = ad.creative ?? { id: ad.id }

      return {
        ad,
        creative,
        insights: safeInsights,
        computedMetrics: {
          roas: computeRoas(safeInsights),
          ctr,
          cpc,
          cpm,
          spend,
          impressions,
          clicks,
          revenue: computeRevenue(safeInsights),
          hookRate,
          retentionRate,
          completionRate,
        },
      }
    })

    creativesWithMetrics.sort((a, b) => b.computedMetrics.spend - a.computedMetrics.spend)

    return NextResponse.json({ creatives: creativesWithMetrics })
  } catch (error) {
    console.error('[/api/creatives] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch creatives' },
      { status: 500 }
    )
  }
}
