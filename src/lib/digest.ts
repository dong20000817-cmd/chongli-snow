import type { DailySummary, ResortForecast, Snapshot } from './types'
import { dailyFor, dailyScore, TIERS } from './recommend'
import { dayLabel, datesOf, effectiveDayIndex } from './time'
import { windLevel } from './wind'
import { fmtVis, tempShort } from './format'
import { ROAD_DATA, SNOW_DATA, roadStateColor, timeOf } from './status'

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

export interface DigestData {
  date: string
  dateLabel: string
  isTomorrow: boolean
  weather: WeatherDigestRow[]
  snow: SnowHighlight[]
  road: typeof ROAD_DATA
  text: string
}

export function buildDigest(snapshot: Snapshot): DigestData {
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
  for (const [id, data] of Object.entries(SNOW_DATA.resorts)) {
    for (const c of data.changes) {
      snow.push({ resort: data.short, resortId: id, type: c.type, text: c.text })
    }
  }
  const order = { open: 0, expected: 1, closed: 2 }
  snow.sort((a, b) => order[a.type] - order[b.type])

  const date = weather[0]?.daily.date ?? snapshot.today
  const dateLabel = `${date.slice(5).replace('-', '/')} ${dayLabel(date, idx)}`
  const text = buildText(dateLabel, weather, snow)
  return { date, dateLabel, isTomorrow: idx === 1, weather, snow, road: ROAD_DATA, text }
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
    '天气数据：Open-Meteo · 雪道/路况为官方公众号及公开信息人工整理 · 以官方为准',
    '#崇礼滑雪 #滑雪天气通 #万龙滑雪场 #滑雪攻略',
  ].join('\n')
}

export function roadColor(key: string): string {
  return roadStateColor(key as 'good' | 'slow' | 'bad')
}

export function roadUpdated(): string {
  return timeOf(ROAD_DATA.updatedAt)
}

export function snowUpdated(): string {
  return timeOf(SNOW_DATA.updatedAt)
}
