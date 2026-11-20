import { describe, expect, it } from 'vitest'
import {
  buildPosterData,
  defaultSettings,
  defaultSubtitle,
  posterFilename,
  posterMeta,
  resortsForScope,
  scopeLabel,
} from '../src/lib/poster'
import type { AirPoint, HourPoint, ResortForecast, Snapshot } from '../src/lib/types'
import { RESORTS } from '../src/data/resorts'

const PROFILES: Record<string, { temp: number; feels: number; wind: number; gust: number; vis: number }> = {
  wanlong: { temp: -12, feels: -19, wind: 10, gust: 18, vis: 15000 },
  genting: { temp: -13, feels: -20, wind: 14, gust: 24, vis: 12000 },
  thaiwoo: { temp: -11, feels: -18, wind: 18, gust: 28, vis: 10000 },
  fulong: { temp: -9, feels: -17, wind: 24, gust: 40, vis: 3000 },
  galaxy: { temp: -10, feels: -18, wind: 26, gust: 42, vis: 2800 },
  dolomiti: { temp: -14, feels: -22, wind: 27, gust: 44, vis: 2600 },
  xueruyi: { temp: -15, feels: -26, wind: 40, gust: 62, vis: 1500 },
  jinshanling: { temp: -8, feels: -24, wind: 55, gust: 80, vis: 600 },
}

function air(overrides: Partial<AirPoint> = {}): AirPoint {
  return { temp: -10, feels: -15, code: 1, isDay: 1, vis: 10000, wind: 20, gust: 35, dir: 315, snow: 0, ...overrides }
}

function resort(id: string): ResortForecast {
  const meta = RESORTS.find(r => r.id === id)!
  const p = PROFILES[id]
  const hourly: HourPoint[] = []
  for (const date of ['2026-11-20', '2026-11-21', '2026-11-22']) {
    for (let h = 0; h < 24; h++) {
      hourly.push({
        time: `${date}T${String(h).padStart(2, '0')}:00`,
        base: air({ temp: p.temp + 4, feels: p.feels + 4, vis: p.vis, wind: p.wind * 0.6, gust: p.gust * 0.6 }),
        peak: air({ temp: p.temp, feels: p.feels, vis: p.vis, wind: p.wind, gust: p.gust }),
      })
    }
  }
  return { ...meta, hourly }
}

function snapshot(): Snapshot {
  const resorts = Object.fromEntries(RESORTS.map(r => [r.id, resort(r.id)]))
  return {
    version: 1,
    fetchedAt: Date.now(),
    generatedAt: '2026-11-20T07:30',
    today: '2026-11-20',
    source: 'test',
    resorts,
  }
}

describe('poster settings', () => {
  it('defaults to grid, 3:4, all fields on, and the confirmed handle', () => {
    const s = defaultSettings(snapshot())
    expect(s.layout).toBe('grid')
    expect(s.size).toBe('3:4')
    expect(s.day).toBe(0)
    expect(s.scope).toBe('all')
    expect(s.show).toEqual({ temp: true, wind: true, vis: true, feels: true })
    expect(s.handle).toBe('董次打次')
    expect(s.title).toBe('今日滑雪指数')
    expect(s.subtitle).toContain('8 家雪场')
  })

  it('filters resorts by scope and falls back for empty custom sets', () => {
    const snap = snapshot()
    expect(resortsForScope(snap, 'all', [])).toHaveLength(8)
    expect(resortsForScope(snap, 'chongli', [])).toHaveLength(7)
    expect(resortsForScope(snap, 'custom', ['wanlong', 'jinshanling'])).toHaveLength(2)
    expect(resortsForScope(snap, 'custom', [])).toHaveLength(8)
  })

  it('labels a mixed custom selection', () => {
    const snap = snapshot()
    const rows = resortsForScope(snap, 'custom', ['wanlong', 'jinshanling']).map(r => ({
      resort: r,
      daily: null as never,
      score: 0,
    }))
    expect(scopeLabel('custom', rows)).toBe('崇礼 + 金山岭')
    expect(defaultSubtitle('custom', rows)).toContain('2 家雪场')
  })
})

describe('poster data', () => {
  it('sorts by score, counts tiers, and always includes feels', () => {
    const data = buildPosterData(snapshot(), defaultSettings(snapshot()))
    expect(data.rows).toHaveLength(8)
    expect(data.rows[0].score).toBeGreaterThanOrEqual(data.rows[7].score)
    expect(data.counts).toEqual({ great: 3, okay: 3, poor: 1, hell: 1 })
    expect(data.best.resort.id).toBe('wanlong')
    expect(data.dateLabel).toBe('11/20 周五')
    expect(posterMeta(data.rows[0], defaultSettings(snapshot()).show)).toContain('体感')
  })

  it('drops feels from the meta when the toggle is off', () => {
    const s = defaultSettings(snapshot())
    s.show.feels = false
    const data = buildPosterData(snapshot(), s)
    expect(posterMeta(data.rows[0], s.show)).not.toContain('体感')
  })

  it('uses a 1080×1920 filename for 9:16', () => {
    const s = defaultSettings(snapshot())
    const data = buildPosterData(snapshot(), s)
    expect(posterFilename(s, data)).toContain('双列-3x4')
    s.size = '9:16'
    expect(posterFilename(s, data)).toContain('9x16')
  })

  it('marks tomorrow when day is 1', () => {
    const s = defaultSettings(snapshot())
    s.day = 1
    const data = buildPosterData(snapshot(), s)
    expect(data.isTomorrow).toBe(true)
    expect(data.dateLabel).toContain('11/21')
  })
})
