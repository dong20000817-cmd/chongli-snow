import type { HourPoint, Risk } from './types'

const WD = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
export const WIND_NAMES = ['无风', '软风', '轻风', '微风', '和风', '清风', '强风', '疾风', '大风', '烈风', '狂风', '暴风', '飓风']

export function windLevel(kmh: number | null | undefined): number {
  const v = Number(kmh)
  if (!Number.isFinite(v)) return 0
  const th = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
  for (let i = 0; i < th.length; i++) if (v < th[i]) return i
  return 12
}

export function windName(level: number): string {
  return WIND_NAMES[Math.max(0, Math.min(12, level))] ?? ''
}

export function dirText(deg: number | null | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return '—'
  return `${WD[Math.round(Number(deg) / 45) % 8]}风`
}

export function dirShort(deg: number | null | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return '—'
  return WD[Math.round(Number(deg) / 45) % 8]
}

export function levelColor(level: number): string {
  if (level >= 8) return '#FF453A'
  if (level >= 6) return '#FF9F0A'
  if (level >= 4) return '#FFD60A'
  return '#30D158'
}

export function riskOf(hour: HourPoint): Risk {
  const w = Number(hour.peak.wind) || 0
  const g = Number(hour.peak.gust) || 0
  if (w >= 50 || g >= 75) return { key: 'stop', label: '可能停运', color: '#FF453A', score: 0 }
  if (w >= 39 || g >= 60) return { key: 'slow', label: '可能降速', color: '#FF9F0A', score: 45 }
  return { key: 'ok', label: '正常', color: '#30D158', score: 100 }
}

export function windScore(level: number): number {
  return [100, 100, 96, 90, 80, 65, 40, 20, 5, 0, 0, 0, 0][Math.max(0, Math.min(12, level))] ?? 0
}

export function visScore(m: number | null | undefined): number {
  if (m == null || !Number.isFinite(m)) return 60
  if (m >= 10000) return 100
  if (m >= 5000) return 90
  if (m >= 3000) return 75
  if (m >= 2000) return 60
  if (m >= 1000) return 35
  if (m >= 500) return 15
  return 0
}

export function feelScore(f: number | null | undefined): number {
  if (f == null || !Number.isFinite(f)) return 50
  if (f >= -15) return 100
  if (f >= -20) return 90
  if (f >= -25) return 65
  if (f >= -28) return 40
  if (f >= -30) return 15
  return 0
}
