// Meta API Types

export interface Campaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED'
  objective: string
  created_time: string
  updated_time: string
  insights?: CampaignInsights
}

export interface AdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED'
  daily_budget?: string
  lifetime_budget?: string
  insights?: AdInsights
}

export interface Ad {
  id: string
  name: string
  adset_id: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED'
  creative?: AdCreative
  insights?: AdInsights
}

export interface AdCreative {
  id: string
  name?: string
  thumbnail_url?: string
  video_id?: string
  image_url?: string
  body?: string
  title?: string
  call_to_action_type?: string
  object_type?: 'VIDEO' | 'IMAGE' | 'STATUS'
}

export interface AdInsights {
  spend: string
  impressions: string
  clicks: string
  reach?: string
  frequency?: string
  ctr: string
  cpc?: string
  cpm?: string
  cpp?: string
  purchase_roas?: { action_type: string; value: string }[]
  actions?: { action_type: string; value: string }[]
  action_values?: { action_type: string; value: string }[]
  video_play_actions?: { action_type: string; value: string }[]
  video_p25_watched_actions?: { action_type: string; value: string }[]
  video_p100_watched_actions?: { action_type: string; value: string }[]
  date_start: string
  date_stop: string
}

export interface VideoInsights {
  play_rate?: number
  avg_watch_time?: number
  completion_rate?: number
  video_play_curve_actions?: number[]
  total_video_views?: number
  total_video_complete_views?: number
  total_video_avg_time_watched?: number
}

export interface CampaignInsights {
  spend: number
  impressions: number
  clicks: number
  ctr: number
  roas: number
  revenue: number
  date_start: string
  date_stop: string
}

export interface CreativeWithMetrics {
  ad: Ad
  creative: AdCreative
  insights: AdInsights
  videoInsights?: VideoInsights
  computedMetrics: {
    roas: number
    ctr: number
    cpc: number
    cpm: number
    spend: number
    impressions: number
    clicks: number
    revenue: number
    hookRate: number
    retentionRate: number
    // legacy video fields
    playRate?: number
    avgWatchTime?: number
    completionRate?: number
  }
}

export interface FunnelData {
  impressions: number
  clicks: number
  linkClicks: number
  viewContent: number
  addToCart: number
  initiateCheckout: number
  purchase: number
}

export interface DashboardData {
  campaigns: Campaign[]
  totalKPIs: {
    totalSpend: number
    totalRevenue: number
    totalImpressions: number
    totalClicks: number
    avgRoas: number
    avgCtr: number
  }
  roasOverTime: { date: string; roas: number; spend: number; revenue: number }[]
  funnelData: FunnelData
}

// Date filter (replaces DateRange shortcut)
export interface DateFilter {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  label?: string
}

// AI Analysis Types
export interface AIAnalysisRequest {
  creative: AdCreative
  insights: AdInsights
  videoInsights?: VideoInsights
  campaignName: string
  adSetName?: string
}

export interface AIAnalysisResponse {
  diagnosis: string
  recommendations: string[]
  projections: string
  score: number
  strengths: string[]
  weaknesses: string[]
}
