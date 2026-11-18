import type { Snapshot } from './types'
import { DEFAULT_RESORT_ID } from '../data/resorts'

const SNAPSHOT_KEY = 'ski-weather-snapshot-v1'
const RESORT_KEY = 'ski-weather-resort-v1'

export function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Snapshot
    if (parsed.version !== 1 || !parsed.resorts || !parsed.generatedAt || !parsed.today) return null
    const first = Object.values(parsed.resorts)[0]
    if (!first?.hourly?.length) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSnapshot(snapshot: Snapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    // 隐私模式/容量不足时静默失败，页面仍可正常联网使用
  }
}

export function loadResortId(): string {
  try {
    return localStorage.getItem(RESORT_KEY) || DEFAULT_RESORT_ID
  } catch {
    return DEFAULT_RESORT_ID
  }
}

export function saveResortId(id: string): void {
  try {
    localStorage.setItem(RESORT_KEY, id)
  } catch {
    // ignore
  }
}
