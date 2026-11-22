import trailJson from '../data/trails.json'
import { RESORTS } from '../data/resorts'
import type { ResortMeta } from './types'

/** 雪道难度。中国雪场官方图例常用 绿/蓝/红/黑，北美体系另有双黑（双钻）。 */
export type Grade = 'green' | 'blue' | 'red' | 'black' | 'double'

/** 今日人工标注的状态。未标注的雪道不写入存储。 */
export type TrailStatus = 'open' | 'new' | 'tomorrow' | 'snow' | 'training' | 'closed'

export interface Trail {
  name: string
  grade: Grade
  /** 长度，单位 km；0 表示暂无数据 */
  len: number
  note: string
}

export interface ResortTrails {
  name: string
  short: string
  source: string
  season: string
  planned: number
  note: string
  trails: Trail[]
}

export interface TrailDataset {
  version: number
  season: string
  compiledAt: string
  sources: string[]
  resorts: Record<string, ResortTrails>
}

export const TRAILS = trailJson as TrailDataset
export const TRAIL_TOTAL = Object.values(TRAILS.resorts).reduce((s, r) => s + r.trails.length, 0)

export const GRADE_ORDER: Grade[] = ['green', 'blue', 'red', 'black', 'double']

export const GRADE_META: Record<Grade, { label: string; sub: string; color: string }> = {
  green: { label: '绿道', sub: '初级', color: '#30D158' },
  blue: { label: '蓝道', sub: '中级', color: '#0A84FF' },
  red: { label: '红道', sub: '高级', color: '#FF453A' },
  black: { label: '黑道', sub: '高级+', color: '#EDF2F7' },
  double: { label: '双黑', sub: '专家', color: '#FFD60A' },
}

/** 展示顺序：最有信息量的状态在前，“开放”垫底。 */
export const STATUS_ORDER: TrailStatus[] = ['new', 'tomorrow', 'snow', 'training', 'closed', 'open']

export const STATUS_META: Record<TrailStatus, { label: string; short: string; color: string; hint: string }> = {
  new: { label: '今日新开', short: '新', color: '#00E5C0', hint: '今天首次开放' },
  tomorrow: { label: '明日预计', short: '明', color: '#B78BFF', hint: '预计明天开放' },
  snow: { label: '补雪中', short: '雪', color: '#5AC8FA', hint: '造雪/补雪，雪况可能变' },
  training: { label: '训练道', short: '训', color: '#FFB020', hint: '训练队占用，时段封道' },
  closed: { label: '临时关闭', short: '关', color: '#FF6B6B', hint: '风大/冰面/赛事临时关' },
  open: { label: '开放', short: '开', color: '#C7D0DA', hint: '正常开放' },
}

/** 算作“可滑”的状态。训练道仍可滑，但可能分时段封道。 */
const SKIABLE: TrailStatus[] = ['open', 'new', 'snow', 'training']

export function isSkiable(s: TrailStatus): boolean {
  return SKIABLE.includes(s)
}

export function trailLen(len: number): string {
  if (!len) return ''
  return len >= 1 ? `${len.toFixed(1)} km` : `${Math.round(len * 1000)} m`
}

export function trailByGrade(resortId: string): Array<{ grade: Grade; trails: Trail[] }> {
  const data = TRAILS.resorts[resortId]
  if (!data) return []
  return GRADE_ORDER
    .map(grade => ({ grade, trails: data.trails.filter(t => t.grade === grade) }))
    .filter(g => g.trails.length > 0)
}

export function resortTrailCount(resortId: string): number {
  return TRAILS.resorts[resortId]?.trails.length ?? 0
}

/* ------------------------------------------------------------------ */
/* 本地存储：按日期存一份人工标注                                        */
/* ------------------------------------------------------------------ */

export interface TrailDay {
  date: string
  /** resortId -> 雪道名 -> 状态 */
  marks: Record<string, Record<string, TrailStatus>>
  /** 已录完的雪场 */
  done: Record<string, boolean>
  updatedAt: string
}

export interface TrailBook {
  version: 1
  days: Record<string, TrailDay>
}

const KEY = 'ski:trail-book:v1'
const KEEP_DAYS = 21

export function createEmptyBook(): TrailBook {
  return { version: 1, days: {} }
}

export function emptyDay(date: string): TrailDay {
  return { date, marks: {}, done: {}, updatedAt: '' }
}

function isoNow(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 取某一天的标注。若当天还没建过，就把上一天“明日预计”的雪道顺延成“今日新开”，
 * 其他状态不继承——每天都要重新录入当天的真实情况。
 */
function shiftDate(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d) + delta * 86400000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`
}

export function ensureDay(book: TrailBook, date: string): { book: TrailBook; day: TrailDay; carried: number } {
  const existing = book.days[date]
  if (existing) return { book, day: existing, carried: 0 }

  // 只继承“昨天”的明日预计；中间隔了几天就不再顺延。
  const previous = book.days[shiftDate(date, -1)] ? shiftDate(date, -1) : null

  let carried = 0
  const marks: TrailDay['marks'] = {}
  if (previous) {
    for (const [resortId, trails] of Object.entries(book.days[previous].marks)) {
      const next: Record<string, TrailStatus> = {}
      for (const [name, status] of Object.entries(trails)) {
        if (status === 'tomorrow') {
          next[name] = 'new'
          carried += 1
        }
      }
      if (Object.keys(next).length) marks[resortId] = next
    }
  }

  const day: TrailDay = { date, marks, done: {}, updatedAt: isoNow() }
  const days = { ...book.days, [date]: day }
  const keep = Object.keys(days).sort().slice(-KEEP_DAYS)
  const pruned: Record<string, TrailDay> = {}
  for (const d of keep) pruned[d] = days[d]

  return { book: { version: 1, days: pruned }, day, carried }
}

export function loadBook(today: string): { book: TrailBook; day: TrailDay; carried: number } {
  let stored: TrailBook | null = null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TrailBook
      if (parsed?.version === 1 && parsed.days && typeof parsed.days === 'object') stored = parsed
    }
  } catch {
    stored = null
  }
  const result = ensureDay(stored ?? createEmptyBook(), today)
  if (!stored || result.book !== stored) persistBook(result.book)
  return result
}

function persistBook(book: TrailBook): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(book))
  } catch {
    /* 隐私模式/容量不足时静默失败 */
  }
}

export function saveDay(book: TrailBook, day: TrailDay): TrailBook {
  const next: TrailBook = { version: 1, days: { ...book.days, [day.date]: day } }
  persistBook(next)
  return next
}

/* ------------------------------------------------------------------ */
/* 纯函数：改标注                                                       */
/* ------------------------------------------------------------------ */

export function setTrailStatus(day: TrailDay, resortId: string, trailName: string, status: TrailStatus | null): TrailDay {
  const resort = { ...(day.marks[resortId] ?? {}) }
  if (status) resort[trailName] = status
  else delete resort[trailName]
  const marks = { ...day.marks, [resortId]: resort }
  if (!Object.keys(resort).length) delete marks[resortId]
  return { ...day, marks, updatedAt: isoNow() }
}

export function setManyStatus(day: TrailDay, resortId: string, trailNames: string[], status: TrailStatus | null): TrailDay {
  const resort = { ...(day.marks[resortId] ?? {}) }
  for (const name of trailNames) {
    if (status) resort[name] = status
    else delete resort[name]
  }
  const marks = { ...day.marks, [resortId]: resort }
  if (!Object.keys(resort).length) delete marks[resortId]
  return { ...day, marks, updatedAt: isoNow() }
}

export function toggleTrail(day: TrailDay, resortId: string, trailName: string, status: TrailStatus): TrailDay {
  const current = day.marks[resortId]?.[trailName]
  return setTrailStatus(day, resortId, trailName, current === status ? null : status)
}

export function setResortDone(day: TrailDay, resortId: string, done: boolean): TrailDay {
  const next = { ...day.done }
  if (done) next[resortId] = true
  else delete next[resortId]
  return { ...day, done: next, updatedAt: isoNow() }
}

export function blankCounts(): Record<TrailStatus, number> {
  return { open: 0, new: 0, tomorrow: 0, snow: 0, training: 0, closed: 0 }
}

export function countStatuses(day: TrailDay, resortId?: string): Record<TrailStatus, number> {
  const counts = blankCounts()
  const scope = resortId ? { [resortId]: day.marks[resortId] ?? {} } : day.marks
  for (const trails of Object.values(scope)) {
    for (const status of Object.values(trails)) counts[status] += 1
  }
  return counts
}

export function markedCount(day: TrailDay, resortId?: string): number {
  const counts = countStatuses(day, resortId)
  return STATUS_ORDER.reduce((s, k) => s + counts[k], 0)
}

export function nextPendingResort(day: TrailDay, from: string): string {
  const ids = RESORTS.map(r => r.id)
  const start = Math.max(0, ids.indexOf(from))
  for (let i = 1; i <= ids.length; i++) {
    const id = ids[(start + i) % ids.length]
    if (!day.done[id]) return id
  }
  return ids[(start + 1) % ids.length]
}

/* ------------------------------------------------------------------ */
/* 情报摘要                                                             */
/* ------------------------------------------------------------------ */

export interface TrailStatusGroup {
  status: TrailStatus
  names: string[]
}

export interface TrailDigestRow {
  resort: ResortMeta
  total: number
  done: boolean
  marked: number
  openCount: number
  counts: Record<TrailStatus, number>
  groups: TrailStatusGroup[]
}

export interface TrailDigest {
  date: string
  dateLabel: string
  time: string
  rows: TrailDigestRow[]
  totals: Record<TrailStatus, number>
  openTotal: number
  markedTrails: number
  markedResorts: number
  doneCount: number
  totalTrails: number
  anyMarks: boolean
}

export function buildTrailDigest(day: TrailDay, date: string, time: string): TrailDigest {
  const rows: TrailDigestRow[] = RESORTS.map(resort => {
    const total = resortTrailCount(resort.id)
    const marks = day.marks[resort.id] ?? {}
    const counts = blankCounts()
    for (const status of Object.values(marks)) counts[status] += 1
    const groups: TrailStatusGroup[] = STATUS_ORDER
      .map(status => ({ status, names: Object.entries(marks).filter(([, s]) => s === status).map(([n]) => n) }))
      .filter(g => g.names.length > 0)
    const marked = Object.keys(marks).length
    return {
      resort,
      total,
      done: Boolean(day.done[resort.id]),
      marked,
      openCount: SKIABLE.reduce((s, k) => s + counts[k], 0),
      counts,
      groups,
    }
  })

  const totals = blankCounts()
  for (const row of rows) for (const k of STATUS_ORDER) totals[k] += row.counts[k]

  const weekday = `周${'日一二三四五六'[new Date(`${date}T12:00:00+08:00`).getDay()]}`
  return {
    date,
    dateLabel: `${date.slice(5).replace('-', '/')} ${weekday}`,
    time,
    rows,
    totals,
    openTotal: SKIABLE.reduce((s, k) => s + totals[k], 0),
    markedTrails: STATUS_ORDER.reduce((s, k) => s + totals[k], 0),
    markedResorts: rows.filter(r => r.marked > 0 || r.done).length,
    doneCount: rows.filter(r => r.done).length,
    totalTrails: TRAIL_TOTAL,
    anyMarks: rows.some(r => r.marked > 0),
  }
}

export function trailPosterFilename(digest: TrailDigest, size: '3:4' | '9:16'): string {
  return `滑雪天气通-雪道情报-${digest.date.slice(5)}-${size === '3:4' ? '3x4' : '9x16'}.png`
}

/** 摘要图名字行的状态顺序：先看新开和关闭，再看补雪/训练/明日。 */
export const LINE_ORDER: TrailStatus[] = ['new', 'closed', 'snow', 'training', 'tomorrow', 'open']

/** 把最值得看的几条雪道压成一行，供摘要图用。 */
export function digestLine(row: TrailDigestRow, max = 6): string {
  if (!row.marked) return '未录入'
  const byStatus = new Map(row.groups.map(g => [g.status, g.names]))
  const parts: string[] = []
  let used = 0
  for (const status of LINE_ORDER) {
    if (used >= max) break
    const names = byStatus.get(status)
    if (!names?.length) continue
    const take = names.slice(0, Math.min(2, max - used))
    parts.push(`${STATUS_META[status].short}·${take.join('、')}`)
    used += take.length
  }
  return parts.join('  ')
}
