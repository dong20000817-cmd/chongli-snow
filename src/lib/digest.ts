import type { DailySummary, ResortForecast, Snapshot } from './types'
import { dailyFor, dailyScore, TIERS } from './recommend'
import { dayLabel, datesOf, effectiveDayIndex } from './time'
import { windLevel } from './wind'
import { fmtVis, tempShort } from './format'
import { ROAD_DATA, roadStateColor, timeOf } from './status'
import { RESORTS } from '../data/resorts'
import { TRAILS, countStatuses, markedCount, type TrailDay } from './trails'

export interface WeatherDigestRow {
  resort: ResortForecast
  daily: DailySummary
  score: number
}

export interface SnowHighlight {
  resort: string
  resortId: string
  type: 'open' | 'closed' | 'expected'
  text: string
}

export interface SnowDigestTotal {
  id: string
  short: string
  open: number
  total: number
  marked: boolean
}

export interface DigestData {
  date: string
  dateLabel: string
  isTomorrow: boolean
  weather: WeatherDigestRow[]
  snow: SnowHighlight[]
  snowTotals: SnowDigestTotal[]
  snowTime: string
  hasSnow: boolean
  road: typeof ROAD_DATA
  text: string
}

export function buildDigest(snapshot: Snapshot, day?: TrailDay): DigestData {
  const idx = effectiveDayIndex(snapshot)
  const resorts = Object.values(snapshot.resorts)
  const weather = resorts
    .map(resort => {
      const date = datesOf(resort.hourly)[idx] ?? snapshot.today
      const daily = dailyFor(resort, date)
      return { resort, daily, score: dailyScore(daily) }
    })
    .sort((a, b) => b.score - a.score)

  const snow: SnowHighlight[] = []
  const snowTotals: SnowDigestTotal[] = []
  if (day) {
    for (const meta of RESORTS) {
      const data = TRAILS.resorts[meta.id]
      if (!data) continue
      const marks = day.marks[meta.id] ?? {}
      const counts = countStatuses(day, meta.id)
      const namesOf = (status: string) => Object.entries(marks).filter(([, s]) => s === status).map(([n]) => n)
      const fresh = namesOf('new')
      const expect = namesOf('tomorrow')
      const closed = namesOf('closed')
      if (fresh.length) snow.push({ resort: meta.short, resortId: meta.id, type: 'open', text: `新增 ${fresh.slice(0, 4).join('、')}${fresh.length > 4 ? ` 等 ${fresh.length} 条` : ''}开放` })
      if (expect.length) snow.push({ resort: meta.short, resortId: meta.id, type: 'expected', text: `${expect.slice(0, 4).join('、')}${expect.length > 4 ? ` 等 ${expect.length} 条` : ''}预计明日开放` })
      if (closed.length) snow.push({ resort: meta.short, resortId: meta.id, type: 'closed', text: `${closed.slice(0, 4).join('、')}${closed.length > 4 ? ` 等 ${closed.length} 条` : ''}临时关闭` })
      if (snowTotals.length < 3) {
        snowTotals.push({
          id: meta.id,
          short: meta.short,
          open: (['open', 'new', 'snow', 'training'] as const).reduce((n, k) => n + counts[k], 0),
          total: data.trails.length,
          marked: markedCount(day, meta.id) > 0,
        })
      }
    }
    const order = { open: 0, expected: 1, closed: 2 }
    snow.sort((a, b) => order[a.type] - order[b.type])
  }

  const date = weather[0]?.daily.date ?? snapshot.today
  const dateLabel = `${date.slice(5).replace('-', '/')} ${dayLabel(date, idx)}`
  const text = buildText(dateLabel, weather, snow)
  return {
    date,
    dateLabel,
    isTomorrow: idx === 1,
    weather,
    snow,
    snowTotals,
    snowTime: day?.updatedAt ? timeOf(day.updatedAt) : '',
    hasSnow: Boolean(day && day.updatedAt),
    road: ROAD_DATA,
    text,
  }
}

export function weatherMeta(row: WeatherDigestRow): string {
  const p = row.daily.worst.peak
  return `能见度 ${fmtVis(p.vis)} · ${windLevel(p.wind)}级风 · 体感 ${tempShort(p.feels)}`
}

function buildText(dateLabel: string, weather: WeatherDigestRow[], snow: SnowHighlight[]): string {
  const top = weather.slice(0, 3).map(r => `${r.resort.short} ${TIERS[r.daily.tier].label} ${r.score}`).join('；')
  const low = weather.slice(-2).map(r => `${r.resort.short} ${TIERS[r.daily.tier].label}`).join('、')
  const snowText = snow.slice(0, 4).map(s => `${s.resort}：${s.text}`).join('；')
  const closure = ROAD_DATA.routes.find(r => r.closure)?.closure
  const roadText = closure
    ? `${closure.road} ${closure.segment} 封闭（${closure.reason}），${closure.eta}；绕行 ${closure.detour}`
    : '三条主要路线无官方封路信息，出发前请再看导航'
  return [
    `❄️ ${dateLabel} 崇礼 / 金山岭滑雪情报`,
    '',
    `【天气】最推荐：${top}。${low ? `相对靠后：${low}。` : ''}`,
    `【雪道】${snowText || '今日暂无新增开放/关闭记录'}。`,
    `【路况】${roadText}。`,
    '',
    '天气数据：Open-Meteo · 雪道为 App 内人工标注 · 路况为公开信息人工整理 · 以官方为准',
    '#崇礼滑雪 #滑雪天气通 #万龙滑雪场 #滑雪攻略',
  ].join('\n')
}

export function roadColor(key: string): string {
  return roadStateColor(key as 'good' | 'slow' | 'bad')
}

export function roadUpdated(): string {
  return timeOf(ROAD_DATA.updatedAt)
}
