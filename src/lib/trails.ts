import trailJson from '../data/trails.json'
import { RESORTS } from '../data/resorts'
import type { ResortMeta } from './types'

/** 雪道颜色等级。红道目前只有雪如意使用。 */
export type Grade = 'green' | 'blue' | 'red' | 'black' | 'double'

/** 今日状态。open 表示长期已开放，只写入 opened，不写入当天 marks。 */
export type TrailStatus = 'open' | 'new' | 'tomorrow' | 'snow' | 'training' | 'closed'

export interface Trail {
  name: string
  grade: Grade
  /** 官方叫法：初级 / 初中级 / 中级 / 中高级 / 高级 / 黑道 / 双黑 / 公园 */
  level?: string
  /** 长度，单位 km；0 表示暂无数据 */
  len: number
  note: string
  /** 官方分段的雪道，默认上段 / 下段 */
  segments?: string[]
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
  black: { label: '黑道', sub: '高级', color: '#EDF2F7' },
  double: { label: '双黑', sub: '专家', color: '#FFD60A' },
}

/** 展示顺序：日常最关心的状态在前，“已开放”是长期记忆，放最后。 */
export const STATUS_ORDER: TrailStatus[] = ['new', 'tomorrow', 'snow', 'training', 'closed', 'open']

export const STATUS_META: Record<TrailStatus, { label: string; short: string; color: string; hint: string }> = {
  new: { label: '今日新开', short: '新开', color: '#00E5C0', hint: '今天首次开放' },
  tomorrow: { label: '明日预计开放', short: '明日', color: '#B78BFF', hint: '预计明天开放' },
  snow: { label: '补雪中', short: '补雪', color: '#5AC8FA', hint: '造雪/补雪，雪况可能变' },
  training: { label: '训练道', short: '训练', color: '#FFB020', hint: '训练队占用，时段封道' },
  closed: { label: '临时关闭', short: '关闭', color: '#FF6B6B', hint: '风大/冰面/赛事临时关' },
  open: { label: '已开放', short: '开放', color: '#C7D0DA', hint: '长期记忆，不会再取消' },
}

const SKIABLE: TrailStatus[] = ['open', 'new', 'snow', 'training']

export function isSkiable(s: TrailStatus): boolean {
  return SKIABLE.includes(s)
}

export function trailLen(len: number): string {
  if (!len) return ''
  return len >= 1 ? `${len.toFixed(1)} km` : `${Math.round(len * 1000)} m`
}

export const DEFAULT_LEVEL: Record<Grade, string> = {
  green: '初级', blue: '中级', red: '高级（红道）', black: '高级', double: '双黑',
}

export function levelOf(trail: Trail): string {
  return trail.level || DEFAULT_LEVEL[trail.grade]
}

/** 官方级别和颜色等级不一致时才在界面里额外标出来。 */
export function showLevel(trail: Trail): boolean {
  return levelOf(trail) !== DEFAULT_LEVEL[trail.grade]
}

/* ------------------------------------------------------------------ */
/* 分段：一条雪道可以拆成上段/下段单独标注                                */
/* ------------------------------------------------------------------ */

export const DEFAULT_SEGMENTS = ['上段', '下段']
const SEG_SEP = '|'

export function segmentKey(name: string, seg: string): string {
  return `${name}${SEG_SEP}${seg}`
}

export function parseKey(key: string): { name: string; seg?: string } {
  const at = key.indexOf(SEG_SEP)
  if (at < 0) return { name: key }
  return { name: key.slice(0, at), seg: key.slice(at + 1) }
}

export function unitLabel(key: string): string {
  const { name, seg } = parseKey(key)
  return seg ? `${name}（${seg}）` : name
}

export interface TrailUnit {
  key: string
  trail: Trail
  grade: Grade
  seg?: string
}

/* ------------------------------------------------------------------ */
/* 本地存储：opened 长期记忆 + 每天只存变化                              */
/* ------------------------------------------------------------------ */

export interface TrailDay {
  date: string
  /** resortId -> 雪道 key -> 今日状态（不存 open） */
  marks: Record<string, Record<string, TrailStatus>>
  /** 已录完的雪场 */
  done: Record<string, boolean>
  updatedAt: string
}

export interface TrailBook {
  version: 2
  /** resortId -> 雪道 key -> true。开放过就一直记得。 */
  opened: Record<string, Record<string, true>>
  /** resortId -> 雪道名 -> true。用户把某条雪道拆成上/下段。 */
  splits: Record<string, Record<string, true>>
  days: Record<string, TrailDay>
}

const KEY = 'ski:trail-book:v1'
const KEEP_DAYS = 21

export function createEmptyBook(): TrailBook {
  return { version: 2, opened: {}, splits: {}, days: {} }
}

export function emptyDay(date: string): TrailDay {
  return { date, marks: {}, done: {}, updatedAt: '' }
}

function isoNow(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function shiftDate(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d) + delta * 86400000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`
}

/** 把 v1（每天独立、含 open）迁移到 v2（长期 opened + 每天变化）。 */
export function migrateBook(raw: unknown): TrailBook | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  const days = data.days as Record<string, TrailDay> | undefined
  if (!days || typeof days !== 'object') return null
  if (data.version === 2) return data as unknown as TrailBook

  const opened: TrailBook['opened'] = {}
  const outDays: Record<string, TrailDay> = {}
  const dates = Object.keys(days).sort()
  const latest = dates[dates.length - 1]
  for (const date of dates) {
    const src = days[date]
    if (!src?.marks) continue
    const marks: TrailDay['marks'] = {}
    for (const [resortId, trails] of Object.entries(src.marks)) {
      for (const [key, status] of Object.entries(trails)) {
        if (status === 'open' || status === 'new') {
          opened[resortId] = opened[resortId] ?? {}
          opened[resortId][key] = true
        }
        if (date === latest && status !== 'open') {
          marks[resortId] = marks[resortId] ?? {}
          marks[resortId][key] = status
        }
      }
    }
    outDays[date] = {
      date,
      marks,
      done: date === latest ? (src.done ?? {}) : {},
      updatedAt: src.updatedAt ?? '',
    }
  }
  return { version: 2, opened, splits: {}, days: outDays }
}

/**
 * 取某一天的标注。若当天还没建过，只把昨天“明日预计”顺延成今天的“今日新开”；
 * 其他状态都是当天的临时状态，不继承。已开放由 opened 长期保存。
 */
export function ensureDay(book: TrailBook, date: string): { book: TrailBook; day: TrailDay; carried: number } {
  const existing = book.days[date]
  if (existing) return { book, day: existing, carried: 0 }

  const yesterday = shiftDate(date, -1)
  const previous = book.days[yesterday]
  let carried = 0
  const marks: TrailDay['marks'] = {}
  const opened = { ...book.opened }
  if (previous) {
    for (const [resortId, trails] of Object.entries(previous.marks)) {
      const next: Record<string, TrailStatus> = {}
      for (const [key, status] of Object.entries(trails)) {
        if (status === 'tomorrow') {
          next[key] = 'new'
          opened[resortId] = opened[resortId] ?? {}
          opened[resortId][key] = true
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

  return { book: { version: 2, opened, splits: book.splits, days: pruned }, day, carried }
}

export function loadBook(today: string): { book: TrailBook; day: TrailDay; carried: number } {
  let stored: TrailBook | null = null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) stored = migrateBook(JSON.parse(raw))
  } catch {
    stored = null
  }
  const result = ensureDay(stored ?? createEmptyBook(), today)
  persistBook(result.book)
  return result
}

function persistBook(book: TrailBook): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(book))
  } catch {
    /* 隐私模式/容量不足时静默失败 */
  }
}

export function saveBook(book: TrailBook): void {
  persistBook(book)
}

/* ------------------------------------------------------------------ */
/* 读状态                                                               */
/* ------------------------------------------------------------------ */

export function isOpened(book: TrailBook, resortId: string, key: string): boolean {
  return Boolean(book.opened[resortId]?.[key])
}

export function isSplit(book: TrailBook, resortId: string, trailName: string): boolean {
  return Boolean(book.splits[resortId]?.[trailName])
}

export function statusOf(book: TrailBook, day: TrailDay, resortId: string, key: string): TrailStatus | undefined {
  return day.marks[resortId]?.[key] ?? (isOpened(book, resortId, key) ? 'open' : undefined)
}

export function unitsForResort(book: TrailBook, resortId: string): TrailUnit[] {
  const data = TRAILS.resorts[resortId]
  if (!data) return []
  const units: TrailUnit[] = []
  for (const trail of data.trails) {
    if (isSplit(book, resortId, trail.name)) {
      const segs = trail.segments ?? DEFAULT_SEGMENTS
      for (const seg of segs) {
        units.push({ key: segmentKey(trail.name, seg), trail, grade: trail.grade, seg })
      }
    } else {
      units.push({ key: trail.name, trail, grade: trail.grade })
    }
  }
  return units
}

export function unitsByGrade(book: TrailBook, resortId: string): Array<{ grade: Grade; units: TrailUnit[] }> {
  const all = unitsForResort(book, resortId)
  return GRADE_ORDER
    .map(grade => ({ grade, units: all.filter(u => u.grade === grade) }))
    .filter(g => g.units.length > 0)
}

export function totalUnits(book: TrailBook, resortId: string): number {
  return unitsForResort(book, resortId).length
}

export function blankCounts(): Record<TrailStatus, number> {
  return { open: 0, new: 0, tomorrow: 0, snow: 0, training: 0, closed: 0 }
}

export function countStatuses(book: TrailBook, day: TrailDay, resortId?: string): Record<TrailStatus, number> {
  const counts = blankCounts()
  const resortIds = resortId ? [resortId] : Object.keys(TRAILS.resorts)
  for (const id of resortIds) {
    for (const unit of unitsForResort(book, id)) {
      const status = statusOf(book, day, id, unit.key)
      if (status) counts[status] += 1
    }
  }
  return counts
}

export function markedCount(book: TrailBook, day: TrailDay, resortId?: string): number {
  const counts = countStatuses(book, day, resortId)
  return counts.new + counts.tomorrow + counts.snow + counts.training + counts.closed
}

export function openedCount(book: TrailBook, resortId: string): number {
  const opened = book.opened[resortId] ?? {}
  return unitsForResort(book, resortId).filter(u => opened[u.key]).length
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
/* 改状态（都返回新 book）                                               */
/* ------------------------------------------------------------------ */

function withDay(book: TrailBook, day: TrailDay): TrailBook {
  return { ...book, days: { ...book.days, [day.date]: { ...day, updatedAt: isoNow() } } }
}

function setOpened(book: TrailBook, resortId: string, keys: string[], value: boolean): Record<string, Record<string, true>> {
  const opened = { ...book.opened }
  const resort = { ...(opened[resortId] ?? {}) }
  for (const key of keys) {
    if (value) resort[key] = true
    else delete resort[key]
  }
  if (Object.keys(resort).length) opened[resortId] = resort
  else delete opened[resortId]
  return opened
}

export function markTrail(book: TrailBook, date: string, resortId: string, key: string, status: TrailStatus | null): TrailBook {
  const base = book.days[date] ?? emptyDay(date)
  const marks = { ...(base.marks[resortId] ?? {}) }
  let opened = book.opened

  if (status === 'open' || status === 'new') {
    opened = setOpened(book, resortId, [key], true)
    if (status === 'open') delete marks[key]
    else marks[key] = 'new'
  } else if (status) {
    marks[key] = status
  } else {
    delete marks[key]
  }

  const dayMarks = { ...base.marks }
  if (Object.keys(marks).length) dayMarks[resortId] = marks
  else delete dayMarks[resortId]

  return withDay({ ...book, opened }, { ...base, marks: dayMarks })
}

export function markMany(book: TrailBook, date: string, resortId: string, keys: string[], status: TrailStatus | null): TrailBook {
  let next = book
  for (const key of keys) next = markTrail(next, date, resortId, key, status)
  return next
}

export function clearDay(book: TrailBook, date: string, resortId: string): TrailBook {
  const base = book.days[date] ?? emptyDay(date)
  const marks = { ...base.marks }
  delete marks[resortId]
  return withDay(book, { ...base, marks })
}

export function resetResort(book: TrailBook, resortId: string): TrailBook {
  const opened = { ...book.opened }
  const splits = { ...book.splits }
  delete opened[resortId]
  delete splits[resortId]
  const days: Record<string, TrailDay> = {}
  for (const [date, day] of Object.entries(book.days)) {
    const marks = { ...day.marks }
    delete marks[resortId]
    days[date] = { ...day, marks }
  }
  return { ...book, opened, splits, days }
}

export function setResortDone(book: TrailBook, date: string, resortId: string, done: boolean): TrailBook {
  const base = book.days[date] ?? emptyDay(date)
  const next = { ...base.done }
  if (done) next[resortId] = true
  else delete next[resortId]
  return withDay(book, { ...base, done: next })
}

const MARK_PRIORITY: TrailStatus[] = ['closed', 'training', 'snow', 'new', 'tomorrow']

export function toggleSplit(book: TrailBook, date: string, resortId: string, trailName: string): TrailBook {
  const trail = TRAILS.resorts[resortId]?.trails.find(t => t.name === trailName)
  if (!trail) return book
  const base = book.days[date] ?? emptyDay(date)
  const marks = { ...(base.marks[resortId] ?? {}) }
  const segs = trail.segments ?? DEFAULT_SEGMENTS
  const keys = segs.map(s => segmentKey(trailName, s))
  const splits = { ...book.splits }
  const resortSplits = { ...(splits[resortId] ?? {}) }

  if (isSplit(book, resortId, trailName)) {
    // 合并：任一段开放就算整条开放；今天的状态取最严重的一个
    let opened = false
    let mark: TrailStatus | undefined
    for (const key of keys) {
      if (isOpened(book, resortId, key)) opened = true
      const s = marks[key]
      if (s && (!mark || MARK_PRIORITY.indexOf(s) < MARK_PRIORITY.indexOf(mark))) mark = s
    }
    delete resortSplits[trailName]
    if (Object.keys(resortSplits).length) splits[resortId] = resortSplits
    else delete splits[resortId]
    const openedMap = setOpened(book, resortId, [trailName], opened)
    for (const key of keys) {
      delete marks[key]
      const o = { ...(openedMap[resortId] ?? {}) }
      delete o[key]
      if (Object.keys(o).length) openedMap[resortId] = o
      else delete openedMap[resortId]
    }
    if (mark) marks[trailName] = mark
    else delete marks[trailName]
    const dayMarks = { ...base.marks }
    if (Object.keys(marks).length) dayMarks[resortId] = marks
    else delete dayMarks[resortId]
    return withDay({ ...book, opened: openedMap, splits }, { ...base, marks: dayMarks })
  }

  // 拆分：把整条的状态复制到两段
  resortSplits[trailName] = true
  splits[resortId] = resortSplits
  let openedMap = setOpened(book, resortId, keys, isOpened(book, resortId, trailName))
  const parentMark = marks[trailName]
  delete marks[trailName]
  for (const key of keys) {
    if (parentMark) marks[key] = parentMark
    else delete marks[key]
  }
  const o = { ...(openedMap[resortId] ?? {}) }
  delete o[trailName]
  if (Object.keys(o).length) openedMap[resortId] = o
  else delete openedMap[resortId]
  const dayMarks = { ...base.marks }
  if (Object.keys(marks).length) dayMarks[resortId] = marks
  else delete dayMarks[resortId]
  return withDay({ ...book, opened: openedMap, splits }, { ...base, marks: dayMarks })
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
  opened: number
  done: boolean
  marked: number
  counts: Record<TrailStatus, number>
  groups: TrailStatusGroup[]
  extras: string[]
  hasSplit: boolean
}

export interface TrailDigest {
  date: string
  dateLabel: string
  time: string
  rows: TrailDigestRow[]
  totals: Record<TrailStatus, number>
  openedTotal: number
  markedTrails: number
  markedResorts: number
  doneCount: number
  totalTrails: number
  anyMarks: boolean
}

export function buildTrailDigest(book: TrailBook, day: TrailDay, date: string, time: string, exclude: string[] = []): TrailDigest {
  const skip = new Set(exclude)
  const rows: TrailDigestRow[] = RESORTS.filter(meta => !skip.has(meta.id)).map(resort => {
    const units = unitsForResort(book, resort.id)
    const counts = blankCounts()
    const groups: TrailStatusGroup[] = []
    const extras: string[] = []
    for (const unit of units) {
      const status = statusOf(book, day, resort.id, unit.key)
      if (!status) continue
      counts[status] += 1
      if (status === 'open') continue
      const label = unitLabel(unit.key)
      let group = groups.find(g => g.status === status)
      if (!group) {
        group = { status, names: [] }
        groups.push(group)
      }
      group.names.push(label)
      const level = levelOf(unit.trail)
      if (level !== DEFAULT_LEVEL[unit.grade] && !extras.includes(level)) extras.push(level)
    }
    groups.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    return {
      resort,
      total: units.length,
      opened: units.filter(u => isOpened(book, resort.id, u.key)).length,
      done: Boolean(day.done[resort.id]),
      marked: Object.keys(day.marks[resort.id] ?? {}).length,
      counts,
      groups,
      extras,
      hasSplit: units.some(u => Boolean(u.seg)),
    }
  }).filter(row => row.opened > 0 || row.marked > 0)

  const totals = blankCounts()
  for (const row of rows) for (const k of STATUS_ORDER) totals[k] += row.counts[k]

  const weekday = `周${'日一二三四五六'[new Date(`${date}T12:00:00+08:00`).getDay()]}`
  return {
    date,
    dateLabel: `${date.slice(5).replace('-', '/')} ${weekday}`,
    time,
    rows,
    totals,
    openedTotal: rows.reduce((n, r) => n + r.opened, 0),
    markedTrails: rows.reduce((n, r) => n + r.marked, 0),
    markedResorts: rows.length,
    doneCount: rows.filter(r => r.done).length,
    totalTrails: rows.reduce((n, r) => n + r.total, 0),
    anyMarks: rows.length > 0,
  }
}

export function trailPosterFilename(digest: TrailDigest, size: '3:4' | '9:16', height?: number): string {
  const h = height ? `-1080x${height * 2}` : ''
  return `滑雪天气通-雪道情报-${digest.date.slice(5)}-${size === '3:4' ? '3x4' : '9x16'}${h}.png`
}

/** 某家雪场今天的“有变化”的行，供纯文本预览。 */
export function rowSummary(row: TrailDigestRow): string {
  if (!row.groups.length) return '今日无变化'
  return row.groups.map(g => `${STATUS_META[g.status].label} ${g.names.join('、')}`).join('；')
}
