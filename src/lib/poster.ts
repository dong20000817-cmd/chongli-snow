import { RESORTS } from '../data/resorts'
import type { DailySummary, ResortForecast, Risk, Snapshot, Tier } from './types'
import { dailyFor, dailyScore, TIERS } from './recommend'
import { datesOf, effectiveDayIndex } from './time'
import { fmtDate, fmtVis, tempShort } from './format'
import { riskOf, windLevel } from './wind'

export type PosterLayout = 'grid' | 'list' | 'single'
export type PosterSize = '3:4' | '9:16'
export type PosterTheme = 'night' | 'dawn' | 'fog'
export type PosterScope = 'all' | 'chongli' | 'custom'

export interface PosterShow {
  temp: boolean
  wind: boolean
  vis: boolean
  feels: boolean
}

export interface PosterSettings {
  day: 0 | 1
  scope: PosterScope
  customIds: string[]
  show: PosterShow
  layout: PosterLayout
  size: PosterSize
  theme: PosterTheme
  title: string
  subtitle: string
  handle: string
  footnote: boolean
  updated: boolean
}

export interface PosterRow {
  resort: ResortForecast
  daily: DailySummary
  score: number
}

export interface PosterData {
  date: string
  dateLabel: string
  time: string
  isTomorrow: boolean
  rows: PosterRow[]
  counts: Record<Tier, number>
  best: PosterRow
  worst: PosterRow
  wind: PosterRow
  vis: PosterRow
  feels: PosterRow
  maxGustLevel: number
  minVis: number
  minFeels: number
  risk: Risk
}

const KEY = 'ski:poster:v1'
export const DEFAULT_HANDLE = '董次打次'

export function posterTitle(day: 0 | 1): string {
  return day === 0 ? '今日滑雪指数' : '明日滑雪指数'
}

type ScopeRow = PosterRow | ResortForecast

function regionOf(row: ScopeRow): string {
  return 'resort' in row ? row.resort.region : row.region
}

export function scopeLabel(scope: PosterScope, rows: ScopeRow[]): string {
  if (scope === 'chongli') return '崇礼'
  if (scope === 'custom') {
    const hasChongli = rows.some(r => regionOf(r) === '崇礼')
    const hasChengde = rows.some(r => regionOf(r) === '承德')
    if (hasChongli && hasChengde) return '崇礼 + 金山岭'
    if (hasChengde) return '金山岭'
    return '崇礼'
  }
  return '崇礼 + 金山岭'
}

export function defaultSubtitle(scope: PosterScope, rows: ScopeRow[]): string {
  return `${scopeLabel(scope, rows)} · ${rows.length} 家雪场 · 日间 08:00–17:00`
}

export function resortsForScope(
  snapshot: Snapshot,
  scope: PosterScope,
  customIds: string[],
): ResortForecast[] {
  const all = RESORTS.map(meta => snapshot.resorts[meta.id]).filter((r): r is ResortForecast => Boolean(r))
  if (scope === 'chongli') return all.filter(r => r.region === '崇礼')
  if (scope === 'custom') {
    const ids = new Set(customIds)
    const picked = all.filter(r => ids.has(r.id))
    return picked.length ? picked : all
  }
  return all
}

export function defaultSettings(snapshot: Snapshot): PosterSettings {
  const day = (effectiveDayIndex(snapshot) === 1 ? 1 : 0) as 0 | 1
  const all = resortsForScope(snapshot, 'all', [])
  return {
    day,
    scope: 'all',
    customIds: [],
    show: { temp: true, wind: true, vis: true, feels: true },
    layout: 'grid',
    size: '3:4',
    theme: 'night',
    title: posterTitle(day),
    subtitle: defaultSubtitle('all', all),
    handle: DEFAULT_HANDLE,
    footnote: true,
    updated: true,
  }
}

export function loadPosterSettings(snapshot: Snapshot): PosterSettings {
  const base = defaultSettings(snapshot)
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const p = JSON.parse(raw) as Partial<PosterSettings>
    const scope: PosterScope = p.scope === 'chongli' || p.scope === 'custom' ? p.scope : 'all'
    const customIds = Array.isArray(p.customIds)
      ? p.customIds.filter((id): id is string => typeof id === 'string' && Boolean(snapshot.resorts[id]))
      : []
    const layout: PosterLayout = p.layout === 'list' || p.layout === 'single' ? p.layout : 'grid'
    const size: PosterSize = p.size === '9:16' ? '9:16' : '3:4'
    const theme: PosterTheme = p.theme === 'dawn' || p.theme === 'fog' ? p.theme : 'night'
    const rows = resortsForScope(snapshot, scope, customIds)
    return {
      ...base,
      scope,
      customIds,
      layout,
      size,
      theme,
      show: { ...base.show, ...(p.show ?? {}) },
      handle: typeof p.handle === 'string' && p.handle.trim() ? p.handle : base.handle,
      footnote: p.footnote !== false,
      updated: p.updated !== false,
      subtitle: defaultSubtitle(scope, rows),
    }
  } catch {
    return base
  }
}

export function savePosterSettings(settings: PosterSettings): void {
  try {
    const { day: _day, title: _title, subtitle: _subtitle, ...rest } = settings
    localStorage.setItem(KEY, JSON.stringify(rest))
  } catch {
    /* storage may be unavailable */
  }
}

export function buildPosterData(snapshot: Snapshot, settings: PosterSettings): PosterData {
  const resorts = resortsForScope(snapshot, settings.scope, settings.customIds)
  const rows = resorts
    .map(resort => {
      const date = datesOf(resort.hourly)[settings.day] ?? snapshot.today
      const daily = dailyFor(resort, date)
      return { resort, daily, score: dailyScore(daily) }
    })
    .sort((a, b) => b.score - a.score)

  if (!rows.length) throw new Error('poster: no resorts')

  const counts: Record<Tier, number> = { great: 0, okay: 0, poor: 0, hell: 0 }
  rows.forEach(r => { counts[r.daily.tier] += 1 })

  const maxBy = (fn: (r: PosterRow) => number) => rows.reduce((a, b) => (fn(b) > fn(a) ? b : a))
  const minBy = (fn: (r: PosterRow) => number) => rows.reduce((a, b) => (fn(b) < fn(a) ? b : a))

  const wind = maxBy(r => Number(r.daily.worst.peak.gust) || 0)
  const vis = minBy(r => r.daily.worst.peak.vis ?? 99999)
  const feels = minBy(r => r.daily.worst.peak.feels ?? 0)
  const date = rows[0].daily.date
  const weekday = `周${'日一二三四五六'[new Date(`${date}T12:00:00+08:00`).getDay()]}`

  return {
    date,
    dateLabel: `${fmtDate(date)} ${weekday}`,
    time: snapshot.generatedAt.slice(11, 16),
    isTomorrow: settings.day === 1,
    rows,
    counts,
    best: rows[0],
    worst: rows[rows.length - 1],
    wind,
    vis,
    feels,
    maxGustLevel: windLevel(wind.daily.worst.peak.gust),
    minVis: vis.daily.worst.peak.vis ?? 99999,
    minFeels: feels.daily.worst.peak.feels ?? 0,
    risk: riskOf(wind.daily.worst),
  }
}

export function posterMeta(row: PosterRow, show: PosterShow, compact = false): string {
  const p = row.daily.worst.peak
  const parts: string[] = []
  if (show.temp) parts.push(compact ? tempShort(p.temp) : `山顶 ${tempShort(p.temp)}`)
  if (show.wind) parts.push(`${windLevel(p.wind)}级${compact ? '' : '风'}`)
  if (show.vis) parts.push(compact ? fmtVis(p.vis) : `能见度 ${fmtVis(p.vis)}`)
  if (show.feels) parts.push(`体感 ${tempShort(p.feels)}`)
  return parts.join(' · ')
}

export function posterFilename(settings: PosterSettings, data: PosterData): string {
  const layout = { grid: '双列', list: '榜单', single: '单雪场' }[settings.layout]
  const size = settings.size === '3:4' ? '3x4' : '9x16'
  return `滑雪天气通-天气-${data.date.slice(5)}-${layout}-${size}.png`
}

export function bestWindow(row: PosterRow): string {
  const start = row.daily.best.time.slice(11, 16)
  const hour = Number(start.slice(0, 2))
  const end = Math.min(hour + 2, 17)
  return `${start} – ${String(end).padStart(2, '0')}:00`
}

export function tierOf(row: PosterRow) {
  return TIERS[row.daily.tier]
}
