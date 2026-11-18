import { RESORTS } from '../data/resorts'
import type { AirPoint, HourPoint, Snapshot } from './types'
import { localISO, localParts } from './time'

interface ApiAir {
  temperature_2m?: Array<number | null>
  apparent_temperature?: Array<number | null>
  weather_code?: Array<number | null>
  is_day?: Array<number | null>
  visibility?: Array<number | null>
  wind_speed_10m?: Array<number | null>
  wind_gusts_10m?: Array<number | null>
  wind_direction_10m?: Array<number | null>
  snowfall?: Array<number | null>
}

interface ApiLocation {
  latitude?: number
  longitude?: number
  elevation?: number
  hourly?: ApiAir & { time?: string[] }
}

function num(v: number | null | undefined, fallback = 0): number {
  return v == null || !Number.isFinite(v) ? fallback : Number(v)
}

function nil(v: number | null | undefined): number | null {
  return v == null || !Number.isFinite(v) ? null : Number(v)
}

export function buildApiUrl(): string {
  const lats: number[] = []
  const lons: number[] = []
  const elevs: number[] = []
  for (const r of RESORTS) {
    lats.push(r.lat, r.lat)
    lons.push(r.lon, r.lon)
    elevs.push(r.baseElev, r.peakElev)
  }
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lons.join(','),
    elevation: elevs.join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'is_day',
      'visibility',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'snowfall',
    ].join(','),
    timezone: 'Asia/Shanghai',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
  })
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`
}

function toAir(api: ApiAir, i: number): AirPoint {
  return {
    temp: num(api.temperature_2m?.[i]),
    feels: num(api.apparent_temperature?.[i], num(api.temperature_2m?.[i])),
    code: num(api.weather_code?.[i]),
    isDay: num(api.is_day?.[i]),
    vis: nil(api.visibility?.[i]),
    wind: num(api.wind_speed_10m?.[i]),
    gust: num(api.wind_gusts_10m?.[i]),
    dir: num(api.wind_direction_10m?.[i]),
    snow: num(api.snowfall?.[i]),
  }
}

function toHourly(loc: ApiLocation): HourPoint[] {
  const h = loc.hourly
  if (!h?.time?.length) return []
  return h.time.map((time, i) => ({
    time,
    base: toAir(h, i),
    peak: toAir(h, i),
  }))
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch(buildApiUrl(), { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`天气服务返回 ${res.status}`)
  const data: unknown = await res.json()
  if (!Array.isArray(data) || data.length !== RESORTS.length * 2) {
    throw new Error('天气数据格式异常')
  }
  const arr = data as ApiLocation[]
  const now = new Date()
  const parts = localParts(now)
  const today = parts.date
  const resorts: Snapshot['resorts'] = {}

  for (let i = 0; i < RESORTS.length; i++) {
    const meta = RESORTS[i]
    const baseLoc = arr[i * 2]
    const peakLoc = arr[i * 2 + 1]
    const baseHourly = toHourly(baseLoc)
    const peakHourly = toHourly(peakLoc)
    if (!baseHourly.length || !peakHourly.length) throw new Error(`${meta.short} 暂无数据`)
    const hourly = baseHourly.map((b, j) => {
      const p = peakHourly[j] ?? peakHourly[peakHourly.length - 1]
      return { time: b.time, base: b.base, peak: p.peak }
    })
    resorts[meta.id] = { ...meta, hourly }
  }

  return {
    version: 1,
    fetchedAt: Date.now(),
    generatedAt: localISO(now),
    today,
    source: 'Open-Meteo',
    resorts,
  }
}
