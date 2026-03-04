import { NextRequest, NextResponse } from 'next/server'
import { getAds, getVideoInsights, computeRoas, computeRevenue } from '@/lib/meta-api'
import type { DateFilter, CreativeWithMetrics, AdInsights } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const campaignId = sp.get('campaignId') // optional
    const startDate = sp.get('startDate')
    const endDate = sp.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const filter: DateFilter = { startDate, endDate }

    // Fetch with campaign filter if provided; fallback to all ads if 0 results
    let ads = await getAds(campaignId, filter)

    if (ads.length === 0 && campaignId) {
      console.log('[/api/creatives] 0 ads con filtro de campaña, reintentando sin filtro...')
      ads = await getAds(null, filter)
    }

    console.log(`[/api/creatives] Procesando ${ads.length} ads`)

    const creativesWithMetrics: CreativeWithMetrics[] = await Promise.all(
      ads.map(async (ad) => {
        // Meta API returns insights as { data: AdInsights[] } when using .time_range()
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

        // Thumbnail: always use ad.creative fields (never top-level ad fields)
        const creative = ad.creative ?? { id: ad.id }
        const thumbnailUrl = creative.thumbnail_url ?? creative.image_url ?? null
        console.log(`[/api/creatives] Ad "${ad.name}" → thumbnail: ${thumbnailUrl ? '✓' : '✗'}, spend: ${spend}`)

        let videoInsights = undefined
        if (creative.video_id) {
          videoInsights = await getVideoInsights(creative.video_id)
        }

        return {
          ad,
          creative,
          insights: safeInsights,
          videoInsights,
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
            completionRate: videoInsights?.completion_rate,
            avgWatchTime: videoInsights?.avg_watch_time,
          },
        }
      })
    )

    // Show all creatives (even with 0 spend), sorted by spend desc
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
