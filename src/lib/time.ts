import type { HourPoint, ResortForecast, Snapshot } from './types'

const TZ = 'Asia/Shanghai'

export interface LocalParts {
  date: string
  time: string
  hour: number
  minute: number
}

export function localParts(date = new Date()): LocalParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  const y = get('year')
  const m = get('month')
  const d = get('day')
  const h = get('hour') === '24' ? '00' : get('hour')
  const min = get('minute')
  return { date: `${y}-${m}-${d}`, time: `${h}:${min}`, hour: Number(h), minute: Number(min) }
}

export function localISO(date = new Date()): string {
  const p = localParts(date)
  return `${p.date}T${p.time}`
}

export function hourOf(iso: string): number {
  return Number(iso.slice(11, 13))
}

export function minuteOf(iso: string): number {
  return hourOf(iso) * 60 + Number(iso.slice(14, 16))
}

export function datesOf(hourly: HourPoint[]): string[] {
  return Array.from(new Set(hourly.map(h => h.time.slice(0, 10))))
}

export function currentIndex(resort: ResortForecast, snapshot: Snapshot): number {
  const hh = String(Number(snapshot.generatedAt.slice(11, 13))).padStart(2, '0')
  const key = `${snapshot.today}T${hh}:00`
  const exact = resort.hourly.findIndex(h => h.time === key)
  if (exact >= 0) return exact
  const later = resort.hourly.findIndex(h => h.time >= key)
  return later >= 0 ? later : 0
}

export function currentHour(resort: ResortForecast, snapshot: Snapshot): HourPoint {
  return resort.hourly[currentIndex(resort, snapshot)] ?? resort.hourly[0]
}

export function nowMinutes(snapshot: Snapshot): number {
  return Number(snapshot.generatedAt.slice(11, 13)) * 60 + Number(snapshot.generatedAt.slice(14, 16))
}

export function effectiveDayIndex(snapshot: Snapshot): number {
  return nowMinutes(snapshot) >= 17 * 60 ? 1 : 0
}

export function dayLabel(date: string, idx: number): string {
  if (idx === 0) return '今天'
  if (idx === 1) return '明天'
  const d = new Date(`${date}T12:00:00+08:00`)
  return `周${'日一二三四五六'[d.getDay()]}`
}

export function isStale(snapshot: Snapshot): boolean {
  return Date.now() - snapshot.fetchedAt > 90 * 60 * 1000
}
