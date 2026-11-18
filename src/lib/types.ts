export interface ResortMeta {
  id: string
  name: string
  short: string
  region: '崇礼' | '承德'
  area: string
  lat: number
  lon: number
  baseElev: number
  peakElev: number
}

export interface AirPoint {
  temp: number
  feels: number
  code: number
  isDay: number
  vis: number | null
  wind: number
  gust: number
  dir: number
  snow: number
}

export interface HourPoint {
  time: string
  base: AirPoint
  peak: AirPoint
}

export interface ResortForecast extends ResortMeta {
  hourly: HourPoint[]
}

export interface Snapshot {
  version: 1
  fetchedAt: number
  generatedAt: string
  today: string
  source: string
  resorts: Record<string, ResortForecast>
}

export type Tier = 'great' | 'okay' | 'poor' | 'hell'

export interface DailySummary {
  date: string
  tier: Tier
  counts: Record<Tier, number>
  worst: HourPoint
  best: HourPoint
  high: number | null
  low: number | null
  maxWind: number
  minVis: number
  snow: number
  list: HourPoint[]
}

export type RiskKey = 'ok' | 'slow' | 'stop'

export interface Risk {
  key: RiskKey
  label: string
  color: string
  score: number
}
