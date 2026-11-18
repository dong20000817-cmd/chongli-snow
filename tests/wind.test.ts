import { describe, expect, it } from 'vitest'
import { dirText, riskOf, windLevel } from '../src/lib/wind'
import type { HourPoint } from '../src/lib/types'

const point = (wind: number, gust: number): HourPoint => ({
  time: '2026-11-18T10:00',
  base: { temp: -10, feels: -15, code: 1, isDay: 1, vis: 10000, wind, gust, dir: 315, snow: 0 },
  peak: { temp: -12, feels: -18, code: 1, isDay: 1, vis: 10000, wind, gust, dir: 315, snow: 0 },
})

describe('windLevel', () => {
  it.each([
    [0, 0], [0.9, 0], [1, 1], [5.9, 1], [6, 2], [11.9, 2], [12, 3], [19.9, 3],
    [20, 4], [28.9, 4], [29, 5], [38.9, 5], [39, 6], [49.9, 6], [50, 7], [61.9, 7],
    [62, 8], [74.9, 8], [75, 9], [88.9, 9], [89, 10], [103, 11], [118, 12],
  ])('%s km/h -> %s级', (kmh, level) => {
    expect(windLevel(kmh)).toBe(level)
  })
})

describe('dirText', () => {
  it('maps 8 directions', () => {
    expect(dirText(0)).toBe('北风')
    expect(dirText(45)).toBe('东北风')
    expect(dirText(90)).toBe('东风')
    expect(dirText(180)).toBe('南风')
    expect(dirText(270)).toBe('西风')
    expect(dirText(330)).toBe('西北风')
  })
})

describe('riskOf', () => {
  it('uses sustained wind and gust thresholds', () => {
    expect(riskOf(point(30, 55)).key).toBe('ok')
    expect(riskOf(point(39, 50)).key).toBe('slow')
    expect(riskOf(point(30, 60)).key).toBe('slow')
    expect(riskOf(point(50, 50)).key).toBe('stop')
    expect(riskOf(point(30, 75)).key).toBe('stop')
  })
})
