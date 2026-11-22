import roadJson from '../data/road.json'

export type RoadStateKey = 'good' | 'slow' | 'bad'
export type RoadSegmentStatus = 'open' | 'slow' | 'closed'

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

export const ROAD_DATA = roadJson as RoadData

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
