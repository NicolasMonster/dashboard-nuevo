import { NextRequest, NextResponse } from 'next/server'
import {
  getCampaigns,
  getAdInsightsTimeSeries,
  getAccountFunnelData,
  computeRevenue,
} from '@/lib/meta-api'
import type { DateFilter, AdInsights, CampaignInsights } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const startDate = sp.get('startDate')
    const endDate = sp.get('endDate')
    const accountId = process.env.META_AD_ACCOUNT_ID

    if (!accountId) {
      return NextResponse.json({ error: 'META_AD_ACCOUNT_ID is not configured' }, { status: 500 })
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const filter: DateFilter = { startDate, endDate }

    const [campaigns, timeSeries, funnelData] = await Promise.all([
      getCampaigns(filter),
      getAdInsightsTimeSeries(accountId, filter),
      getAccountFunnelData(filter),
    ])

    // Compute per-campaign metrics
    const campaignsWithMetrics = campaigns.map((campaign) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insightsWrapper = campaign.insights as unknown as { data?: AdInsights[] } & any
      let computedInsights: CampaignInsights | undefined

      if (insightsWrapper?.data?.[0]) {
        const raw: AdInsights = insightsWrapper.data[0]
        const spend = parseFloat(raw.spend ?? '0')
        const revenue = computeRevenue(raw)
        const roas = spend > 0 ? revenue / spend : 0

        computedInsights = {
          spend,
          impressions: parseInt(raw.impressions ?? '0'),
          clicks: parseInt(raw.clicks ?? '0'),
          ctr: parseFloat(raw.ctr ?? '0'),
          roas: parseFloat(roas.toFixed(2)),
          revenue,
          date_start: raw.date_start ?? '',
          date_stop: raw.date_stop ?? '',
        }
      }

      return { ...campaign, insights: computedInsights }
    })

    // Aggregate totals
    const totalSpend = campaignsWithMetrics.reduce((s, c) => s + (c.insights?.spend ?? 0), 0)
    const totalRevenue = campaignsWithMetrics.reduce((s, c) => s + (c.insights?.revenue ?? 0), 0)
    const totalImpressions = campaignsWithMetrics.reduce((s, c) => s + (c.insights?.impressions ?? 0), 0)
    const totalClicks = campaignsWithMetrics.reduce((s, c) => s + (c.insights?.clicks ?? 0), 0)

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      totalKPIs: {
        totalSpend,
        totalRevenue,
        totalImpressions,
        totalClicks,
        avgRoas: totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0,
        avgCtr:
          totalImpressions > 0
            ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2))
            : 0,
      },
      roasOverTime: timeSeries,
      funnelData,
    })
  } catch (error) {
    console.error('[/api/campaigns] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
