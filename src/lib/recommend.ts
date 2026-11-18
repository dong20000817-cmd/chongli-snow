import type { DailySummary, HourPoint, ResortForecast, Tier } from './types'
import { fmtTime, fmtVis, round, tempShort } from './format'
import { dayLabel, hourOf } from './time'
import { dirText, feelScore, levelColor, riskOf, visScore, windLevel, windScore } from './wind'

export interface TierMeta {
  label: string
  color: string
  icon: 'ski' | 'check' | 'warning'
  rank: number
}

export const TIERS: Record<Tier, TierMeta> = {
  great: { label: '非常建议', color: '#30D158', icon: 'ski', rank: 3 },
  okay: { label: '一般建议', color: '#0A84FF', icon: 'check', rank: 2 },
  poor: { label: '不太建议', color: '#FF9F0A', icon: 'warning', rank: 1 },
  hell: { label: '地狱难度', color: '#FF453A', icon: 'warning', rank: 0 },
}

export function tierMeta(tier: Tier): TierMeta {
  return TIERS[tier]
}

export function hourTier(h: HourPoint): Tier {
  const p = h.peak
  const v = p.vis == null ? 99999 : Number(p.vis)
  const w = Number(p.wind) || 0
  const g = p.gust == null ? w * 1.5 : Number(p.gust)
  const f = p.feels == null ? Number(p.temp) : Number(p.feels)
  const s = Number(p.snow) || 0
  const c = Number(p.code) || 0
  if (v < 500 || w >= 50 || g >= 75 || f <= -30 || c >= 95 || [56, 57, 66, 67].includes(c)) return 'hell'
  if (v < 2000 || w >= 39 || g >= 60 || f <= -26) return 'poor'
  if (v >= 5000 && w <= 28 && g < 45 && f >= -20 && s <= 2 && ![45, 48, 95, 96, 97, 98, 99].includes(c)) return 'great'
  return 'okay'
}

export function dailyFor(resort: ResortForecast, date: string): DailySummary {
  const all = resort.hourly.filter(h => h.time.startsWith(date))
  const day = all.filter(h => {
    const hh = hourOf(h.time)
    return hh >= 8 && hh <= 16
  })
  const list = day.length ? day : all
  const counts: Record<Tier, number> = { great: 0, okay: 0, poor: 0, hell: 0 }
  for (const h of list) counts[hourTier(h)] += 1

  let tier: Tier
  if (counts.hell >= 2) tier = 'hell'
  else if (counts.poor + counts.hell >= 3) tier = 'poor'
  else if (counts.great >= 5 && counts.poor + counts.hell === 0) tier = 'great'
  else tier = 'okay'

  const sortedWorst = list.slice().sort((a, b) => {
    const d = TIERS[hourTier(a)].rank - TIERS[hourTier(b)].rank
    if (d) return d
    return (b.peak.gust || 0) - (a.peak.gust || 0)
  })
  const sortedBest = list.slice().sort((a, b) => {
    const d = TIERS[hourTier(b)].rank - TIERS[hourTier(a)].rank
    if (d) return d
    return (a.peak.gust || 0) - (b.peak.gust || 0)
  })
  const baseT = list.map(h => h.base.temp).filter((v): v is number => v != null)
  const minVis = list.reduce((min, h) => Math.min(min, h.peak.vis == null ? 99999 : h.peak.vis), 99999)
  const snow = list.reduce((sum, h) => sum + (Number(h.peak.snow) || 0), 0)

  return {
    date,
    tier,
    counts,
    worst: sortedWorst[0] ?? list[0] ?? resort.hourly[0],
    best: sortedBest[0] ?? sortedWorst[0] ?? resort.hourly[0],
    high: baseT.length ? Math.max(...baseT) : null,
    low: baseT.length ? Math.min(...baseT) : null,
    maxWind: list.length ? Math.max(...list.map(h => windLevel(h.peak.wind))) : 0,
    minVis,
    snow,
    list,
  }
}

export function reasonFor(tier: Tier, worst: HourPoint): string {
  const w = worst.peak
  const wl = windLevel(w.wind)
  const gl = windLevel(w.gust)
  const parts: string[] = []
  if (tier === 'hell') {
    if (w.gust >= 75) parts.push(`山顶阵风 ${gl} 级（${round(w.gust)} km/h），缆车可能停运`)
    else if (w.wind >= 50) parts.push(`山顶持续风 ${wl} 级，缆车可能停运`)
    if (w.vis != null && w.vis < 500) parts.push(`能见度仅 ${fmtVis(w.vis)}`)
    if (w.feels != null && w.feels <= -30) parts.push(`山顶体感 ${round(w.feels)}°`)
    if (!parts.length) parts.push('风力/能见度达到危险级别')
  } else if (tier === 'poor') {
    if (w.gust >= 60) parts.push(`山顶阵风 ${gl} 级，缆车可能降速`)
    if (w.vis != null && w.vis < 2000) parts.push(`能见度 ${fmtVis(w.vis)}，雪道边界辨识困难`)
    if (w.feels != null && w.feels <= -26) parts.push(`山顶体感 ${round(w.feels)}°，注意冻伤`)
    if (!parts.length) parts.push('风偏大或能见度偏低')
  } else if (tier === 'okay') {
    if (w.wind >= 29 || w.gust >= 45) parts.push(`山顶风 ${wl} 级（${round(w.wind)} km/h），风略大但缆车预计正常`)
    else if (w.vis != null && w.vis < 5000) parts.push(`能见度 ${fmtVis(w.vis)}，部分雪道视野一般`)
    else parts.push('天气整体可滑，注意保暖')
  } else {
    parts.push(`能见度 ${fmtVis(w.vis)}，山顶风 ${wl} 级，体感 ${round(w.feels)}°`)
  }
  return parts.slice(0, 2).join('；')
}

export function shortReason(tier: Tier, daily: DailySummary): string {
  const w = daily.worst.peak
  if (tier === 'hell') {
    if (w.gust >= 75) return `阵风 ${windLevel(w.gust)} 级，缆车可能停运`
    if (w.vis != null && w.vis < 500) return `能见度 ${fmtVis(w.vis)}`
    if (w.feels != null && w.feels <= -30) return `体感 ${round(w.feels)}°`
    return '风力达到危险级别'
  }
  if (tier === 'poor') {
    if (w.gust >= 60) return `阵风 ${windLevel(w.gust)} 级，缆车可能降速`
    if (w.vis != null && w.vis < 2000) return `能见度 ${fmtVis(w.vis)}`
    return `体感 ${round(w.feels)}°，注意保暖`
  }
  if (tier === 'okay') {
    if (w.vis != null && w.vis < 2000) return `短时能见度 ${fmtVis(w.vis)}，其余时段可滑`
    if (w.wind >= 29) return `山顶风 ${windLevel(w.wind)} 级，缆车预计正常`
    if (w.feels != null && w.feels <= -26) return `短时体感 ${round(w.feels)}°，其余时段可滑`
    return `能见度 ${fmtVis(w.vis)}，整体可滑`
  }
  const b = daily.best.peak
  return `能见度 ${fmtVis(b.vis)}，风 ${windLevel(b.wind)} 级`
}

export function betterWindow(resort: ResortForecast, daily: DailySummary, idx: number, nowMin: number): string {
  const dates = Array.from(new Set(resort.hourly.map(h => h.time.slice(0, 10))))
  for (let di = idx; di < Math.min(dates.length, idx + 2); di++) {
    const d = dailyFor(resort, dates[di])
    for (let i = 0; i < d.list.length - 1; i++) {
      const a = d.list[i]
      const b = d.list[i + 1]
      const ah = hourOf(a.time)
      const bh = hourOf(b.time)
      if (ah < 8 || bh > 16) continue
      if (di === 0 && ah * 60 < nowMin) continue
      const ta = hourTier(a)
      const tb = hourTier(b)
      const t = TIERS[ta].rank <= TIERS[tb].rank ? ta : tb
      if (TIERS[t].rank > TIERS[daily.tier].rank) {
        const when = di === 0 ? '今天' : di === 1 ? '明天' : dayLabel(dates[di], di)
        return `${when} ${fmtTime(a.time)}–${fmtTime(b.time)} 阵风降至 ${windLevel(b.peak.gust)} 级，${TIERS[t].label}`
      }
    }
  }
  return '未来 24 小时无明显好转窗口，建议改期或换雪场'
}

export function overallScore(hour: HourPoint): number {
  const w = windScore(windLevel(hour.peak.wind))
  const v = visScore(hour.peak.vis)
  const f = feelScore(hour.peak.feels)
  const l = riskOf(hour).score
  const raw = Math.round(w * 0.4 + v * 0.25 + f * 0.2 + l * 0.15)
  const cap = { hell: 24, poor: 54, okay: 84, great: 100 }[hourTier(hour)]
  return Math.min(raw, cap)
}

export interface Factor {
  name: string
  icon: 'wind' | 'eye' | 'thermo' | 'cable'
  value: string
  score: number
  color: string
}

export function factorsFor(hour: HourPoint): Factor[] {
  const w = hour.peak
  const wl = windLevel(w.wind)
  const gl = windLevel(w.gust)
  const risk = riskOf(hour)
  const ws = windScore(wl)
  const vs = visScore(w.vis)
  const fs = feelScore(w.feels)
  return [
    { name: '风力', icon: 'wind', value: `${wl}级 / 阵风${gl}级`, score: ws, color: levelColor(Math.max(wl, gl)) },
    { name: '能见度', icon: 'eye', value: fmtVis(w.vis), score: vs, color: vs >= 80 ? '#30D158' : vs >= 50 ? '#FFD60A' : '#FF453A' },
    { name: '体感温度', icon: 'thermo', value: tempShort(w.feels), score: fs, color: fs >= 80 ? '#30D158' : fs >= 50 ? '#FFD60A' : '#FF453A' },
    { name: '缆车风险', icon: 'cable', value: risk.label, score: risk.score, color: risk.color },
  ]
}


export function dailyScore(daily: DailySummary): number {
  const raw = overallScore(daily.best)
  const cap = { hell: 24, poor: 54, okay: 84, great: 100 }[daily.tier]
  return Math.min(raw, cap)
}

export function findBestDay(days: DailySummary[]): { day: DailySummary; index: number } {
  const sorted = days
    .map((day, index) => ({ day, index }))
    .sort((a, b) => {
      const r = TIERS[b.day.tier].rank - TIERS[a.day.tier].rank
      if (r) return r
      return overallScore(b.day.best) - overallScore(a.day.best)
    })
  return sorted[0]
}

export { dirText }
