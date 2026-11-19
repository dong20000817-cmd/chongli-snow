import { describe, expect, it } from 'vitest'
import { ROAD_DATA, SNOW_DATA, CATEGORY_COLOR, isToday } from '../src/lib/status'
import { RESORTS } from '../src/data/resorts'

describe('road data', () => {
  it('has 3 routes and a closure route', () => {
    expect(ROAD_DATA.routes).toHaveLength(3)
    expect(ROAD_DATA.routes.some(r => r.closure)).toBe(true)
    expect(ROAD_DATA.overall.meta).toContain('3 条')
  })
})

describe('snow data', () => {
  it('covers all 8 resorts', () => {
    for (const r of RESORTS) expect(SNOW_DATA.resorts[r.id]).toBeTruthy()
  })

  it('category counts add up to resort totals', () => {
    for (const [id, r] of Object.entries(SNOW_DATA.resorts)) {
      const total = r.categories.reduce((s, c) => s + c.total, 0)
      const open = r.categories.reduce((s, c) => s + c.open, 0)
      expect(total, id).toBe(r.total)
      expect(open, id).toBe(r.open)
      expect(r.categories).toHaveLength(4)
      for (const c of r.categories) expect(CATEGORY_COLOR[c.id]).toBeTruthy()
    }
  })
})

describe('date freshness', () => {
  it('compares local date strings', () => {
    expect(isToday('2026-11-19T18:40:00+08:00', '2026-11-19')).toBe(true)
    expect(isToday('2026-11-18T18:40:00+08:00', '2026-11-19')).toBe(false)
  })
})
