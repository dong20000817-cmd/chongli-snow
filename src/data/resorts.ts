import type { ResortMeta } from '../lib/types'

export const RESORTS: ResortMeta[] = [
  { id: 'wanlong', name: '万龙滑雪场', short: '万龙', region: '崇礼', area: '红花梁', lat: 40.9613, lon: 115.3931, baseElev: 1600, peakElev: 2110 },
  { id: 'genting', name: '密苑云顶滑雪场', short: '云顶', region: '崇礼', area: '太子城', lat: 40.9503, lon: 115.4258, baseElev: 1580, peakElev: 2100 },
  { id: 'thaiwoo', name: '太舞滑雪小镇', short: '太舞', region: '崇礼', area: '玉石梁', lat: 40.8833, lon: 115.4361, baseElev: 1650, peakElev: 2160 },
  { id: 'fulong', name: '富龙滑雪场', short: '富龙', region: '崇礼', area: '西湾子', lat: 40.9757, lon: 115.3092, baseElev: 1580, peakElev: 1860 },
  { id: 'galaxy', name: '翠云山银河滑雪场', short: '银河', region: '崇礼', area: '翠云山', lat: 40.9987, lon: 115.3055, baseElev: 1620, peakElev: 2000 },
  { id: 'dolomiti', name: '多乐美地滑雪场', short: '多乐', region: '崇礼', area: '喜鹊梁', lat: 40.8350, lon: 115.3836, baseElev: 1650, peakElev: 2074 },
  { id: 'xueruyi', name: '雪如意滑雪场', short: '雪如意', region: '崇礼', area: '古杨树 · 冬奥核心区', lat: 40.910315, lon: 115.471951, baseElev: 1600, peakElev: 1800 },
  { id: 'jinshanling', name: '金山岭银河滑雪场', short: '金山岭', region: '承德', area: '滦平 · 大雁子沟', lat: 40.785197, lon: 117.494809, baseElev: 1150, peakElev: 1679 },
]

export const DEFAULT_RESORT_ID = 'wanlong'
export const RESORT_BY_ID = Object.fromEntries(RESORTS.map(r => [r.id, r])) as Record<string, ResortMeta>
