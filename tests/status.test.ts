import { describe, expect, it } from 'vitest'
import { ROAD_DATA, isToday } from '../src/lib/status'

describe('road data', () => {
  it('has 3 routes and a closure route', () => {
    expect(ROAD_DATA.routes).toHaveLength(3)
    expect(ROAD_DATA.routes.some(r => r.closure)).toBe(true)
    expect(ROAD_DATA.overall.meta).toContain('3 条')
  })
})

describe('date freshness', () => {
  it('compares local date strings', () => {
    expect(isToday('2026-11-19T18:40:00+08:00', '2026-11-19')).toBe(true)
    expect(isToday('2026-11-18T18:40:00+08:00', '2026-11-19')).toBe(false)
  })
})
