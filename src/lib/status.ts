import roadJson from '../data/road.json'
import snowJson from '../data/snow.json'

export type RoadStateKey = 'good' | 'slow' | 'bad'
export type RoadSegmentStatus = 'open' | 'slow' | 'closed'
export type TrailStatus = 'open' | 'closed' | 'expected'
export type CategoryId = 'green' | 'blue' | 'black' | 'double'

export interface RoadSegment {
  name: string
  status: RoadSegmentStatus
  state: string
  sub: string
}

export interface RoadClosure {
  road: string
  segment: string
  reason: string
  startedAt: string
  eta: string
  detour: string
  source: string
  sourceTime: string
}

export interface RoadVisibility {
  name: string
  vis: string
  temp: string
}

export interface RoadRoute {
  id: string
  name: string
  code: string
  meta: string
  distance: string
  duration: string
  state: string
  stateKey: RoadStateKey
  segments: RoadSegment[]
  closure: RoadClosure | null
  visibility: RoadVisibility[]
}

export interface RoadData {
  updatedAt: string
  isDemo: boolean
  source: string
  overall: { level: string; label: string; desc: string; meta: string }
  routes: RoadRoute[]
}

export interface SnowTrail {
  name: string
  len: string
  note: string
  status?: TrailStatus
}

export interface SnowCategory {
  id: CategoryId
  name: string
  sub: string
  open: number
  total: number
  desc: string
  trails: SnowTrail[]
}

export interface SnowFuture {
  label: string
  count: number
  note: string
}

export interface SnowChange {
  type: 'open' | 'closed' | 'expected'
  text: string
}

export interface SnowResortData {
  name: string
  short: string
  updatedAt: string
  source: string
  sourceTime: string
  open: number
  total: number
  liftsOpen: number
  liftsTotal: number
  todayNew: number
  tomorrowExpected: number
  summary: string
  categories: SnowCategory[]
  future: SnowFuture[]
  changes: SnowChange[]
}

export interface SnowData {
  updatedAt: string
  isDemo: boolean
  resorts: Record<string, SnowResortData>
}

export const ROAD_DATA = roadJson as RoadData
export const SNOW_DATA = snowJson as SnowData

export const CATEGORY_COLOR: Record<CategoryId, string> = {
  green: '#30D158',
  blue: '#0A84FF',
  black: '#F2F5F7',
  double: '#FF9F0A',
}

export function roadStateColor(key: RoadStateKey): string {
  if (key === 'good') return '#30D158'
  if (key === 'slow') return '#FF9F0A'
  return '#FF453A'
}

export function isToday(iso: string, today: string): boolean {
  return iso.slice(0, 10) === today
}

export function timeOf(iso: string): string {
  if (!iso) return '—'
  const m = iso.match(/T(\d{2}:\d{2})/)
  return m ? m[1] : iso.slice(11, 16)
}
