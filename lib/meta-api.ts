import type {
  Campaign,
  AdSet,
  Ad,
  AdInsights,
  VideoInsights,
  DateFilter,
  FunnelData,
} from './types'

const BASE_URL = 'https://graph.facebook.com/v21.0'

function timeRange(filter: DateFilter): string {
  return JSON.stringify({ since: filter.startDate, until: filter.endDate })
}

async function metaFetch<T>(
  path: string,
  params: Record<string, string> = {},
  retries = 3
): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN is not set')

  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('access_token', token)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url.toString(), { cache: 'no-store' })

    if (res.status === 429 || res.status === 500) {
      const delay = Math.pow(2, attempt) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(
        error?.error?.message || `Meta API error: ${res.status} ${res.statusText}`
      )
    }

    return res.json() as Promise<T>
  }

  throw new Error('Meta API: max retries exceeded')
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export async function getCampaigns(filter: DateFilter): Promise<Campaign[]> {
  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID is not set')

  const insightFields =
    'spend,impressions,clicks,ctr,purchase_roas,action_values,actions,date_start,date_stop'
  const tr = timeRange(filter)

  const data = await metaFetch<{ data: Campaign[] }>(
    `/act_${accountId.replace('act_', '')}/campaigns`,
    {
      fields: `id,name,status,objective,created_time,updated_time,insights.time_range(${tr}){${insightFields}}`,
      limit: '100',
    }
  )

  return data.data ?? []
}

// ─── Ad Sets ─────────────────────────────────────────────────────────────────

export async function getAdSets(campaignId: string, filter: DateFilter): Promise<AdSet[]> {
  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID is not set')

  const insightFields = 'spend,impressions,clicks,ctr,purchase_roas,action_values,date_start,date_stop'
  const tr = timeRange(filter)

  const data = await metaFetch<{ data: AdSet[] }>(
    `/act_${accountId.replace('act_', '')}/adsets`,
    {
      fields: `id,name,campaign_id,status,daily_budget,lifetime_budget,insights.time_range(${tr}){${insightFields}}`,
      filtering: JSON.stringify([{ field: 'campaign_id', operator: 'EQUAL', value: campaignId }]),
      limit: '100',
    }
  )

  return data.data ?? []
}

// ─── Ads ─────────────────────────────────────────────────────────────────────

export async function getAds(campaignId: string | null, filter: DateFilter): Promise<Ad[]> {
  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!accountId) throw new Error('META_AD_ACCOUNT_ID is not set')

  const insightFields =
    'spend,impressions,clicks,ctr,cpc,cpm,purchase_roas,action_values,actions,' +
    'video_play_actions,video_p25_watched_actions,video_p100_watched_actions,date_start,date_stop'
  const tr = timeRange(filter)

  const params: Record<string, string> = {
    fields:
      `id,name,adset_id,campaign_id,status,` +
      `creative{id,name,thumbnail_url,video_id,image_url,body,title,call_to_action_type,object_type},` +
      `insights.time_range(${tr}){${insightFields}}`,
    limit: '200',
  }

  if (campaignId) {
    params.filtering = JSON.stringify([{ field: 'campaign_id', operator: 'EQUAL', value: campaignId }])
  }

  const data = await metaFetch<{ data: Ad[] }>(
    `/act_${accountId.replace('act_', '')}/ads`,
    params
  )

  const ads = data.data ?? []
  console.log(`[meta-api] getAds — ${ads.length} ads (campaignId: ${campaignId ?? 'todos'})`)
  if (ads.length > 0) {
    const first = ads[0]
    console.log('[meta-api] Primer ad — creative:', JSON.stringify(first.creative, null, 2))
    console.log('[meta-api] Primer ad — insights:', JSON.stringify(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (first.insights as unknown as { data?: unknown[] } & any)?.data?.[0],
      null, 2
    ))
  }

  return ads
}

// ─── Time Series ──────────────────────────────────────────────────────────────

export async function getAdInsightsTimeSeries(
  adAccountId: string,
  filter: DateFilter
): Promise<{ date: string; spend: number; revenue: number; roas: number }[]> {
  const accountId = adAccountId.replace('act_', '')

  const data = await metaFetch<{
    data: {
      spend: string
      action_values?: { action_type: string; value: string }[]
      date_start: string
      date_stop: string
    }[]
  }>(`/act_${accountId}/insights`, {
    fields: 'spend,action_values,date_start,date_stop',
    time_range: timeRange(filter),
    time_increment: '1',
    level: 'account',
  })

  return (data.data ?? []).map((row) => {
    const spend = parseFloat(row.spend ?? '0')
    const revenueStr =
      row.action_values?.find((a) => a.action_type === 'omni_purchase')?.value ??
      row.action_values?.find((a) => a.action_type === 'purchase')?.value ??
      '0'
    const revenue = parseFloat(revenueStr)
    const roas = spend > 0 ? revenue / spend : 0

    return {
      date: row.date_start,
      spend,
      revenue,
      roas: parseFloat(roas.toFixed(2)),
    }
  })
}

// ─── Funnel Data ──────────────────────────────────────────────────────────────

export async function getAccountFunnelData(filter: DateFilter): Promise<FunnelData> {
  const accountId = (process.env.META_AD_ACCOUNT_ID ?? '').replace('act_', '')
  if (!accountId) return emptyFunnel()

  try {
    type RawRow = {
      impressions: string
      clicks: string
      actions?: { action_type: string; value: string }[]
    }

    const data = await metaFetch<{ data: RawRow[] }>(
      `/act_${accountId}/insights`,
      {
        fields: 'impressions,clicks,actions',
        time_range: timeRange(filter),
        level: 'account',
      }
    )

    const row = data.data?.[0]
    if (!row) return emptyFunnel()

    const getAction = (...types: string[]): number => {
      for (const type of types) {
        const found = row.actions?.find((a) => a.action_type === type)
        if (found) return parseInt(found.value ?? '0')
      }
      return 0
    }

    return {
      impressions: parseInt(row.impressions ?? '0'),
      clicks: parseInt(row.clicks ?? '0'),
      linkClicks: getAction('link_click'),
      viewContent: getAction('omni_view_content', 'view_content'),
      addToCart: getAction('omni_add_to_cart', 'add_to_cart'),
      initiateCheckout: getAction('omni_initiated_checkout', 'initiate_checkout'),
      purchase: getAction('omni_purchase', 'purchase'),
    }
  } catch {
    return emptyFunnel()
  }
}

function emptyFunnel(): FunnelData {
  return { impressions: 0, clicks: 0, linkClicks: 0, viewContent: 0, addToCart: 0, initiateCheckout: 0, purchase: 0 }
}

// ─── Video Insights ───────────────────────────────────────────────────────────

export async function getVideoInsights(videoId: string): Promise<VideoInsights> {
  try {
    const data = await metaFetch<{
      data: {
        name: string
        values: { value: number | Record<string, number> }[]
      }[]
    }>(`/${videoId}/video_insights`, {
      fields: 'total_video_views,total_video_complete_views,total_video_avg_time_watched',
      period: 'lifetime',
    })

    const getValue = (name: string): number => {
      const metric = data.data?.find((m) => m.name === name)
      const val = metric?.values?.[0]?.value
      return typeof val === 'number' ? val : 0
    }

    const totalViews = getValue('total_video_views')
    const completeViews = getValue('total_video_complete_views')
    const avgWatchTime = getValue('total_video_avg_time_watched')

    return {
      total_video_views: totalViews,
      total_video_complete_views: completeViews,
      total_video_avg_time_watched: avgWatchTime,
      completion_rate: totalViews > 0 ? completeViews / totalViews : 0,
      avg_watch_time: avgWatchTime,
    }
  } catch {
    return {}
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function computeRoas(insights: AdInsights): number {
  const spend = parseFloat(insights.spend ?? '0')
  if (spend === 0) return 0
  const revenue = computeRevenue(insights)
  return parseFloat((revenue / spend).toFixed(2))
}

export function computeRevenue(insights: AdInsights): number {
  const val =
    insights.action_values?.find((a) => a.action_type === 'omni_purchase')?.value ??
    insights.action_values?.find((a) => a.action_type === 'purchase')?.value ??
    '0'
  return parseFloat(val)
}
