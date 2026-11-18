import { describe, expect, it } from 'vitest'
import { betterWindow, dailyFor, dailyScore, hourTier, overallScore } from '../src/lib/recommend'
import type { AirPoint, HourPoint, ResortForecast } from '../src/lib/types'

function air(overrides: Partial<AirPoint> = {}): AirPoint {
  return { temp: -10, feels: -15, code: 1, isDay: 1, vis: 10000, wind: 20, gust: 35, dir: 315, snow: 0, ...overrides }
}

function hour(time: string, overrides: Partial<AirPoint> = {}): HourPoint {
  return { time, base: air(overrides), peak: air({ temp: -12, feels: -18, ...overrides }) }
}

function resort(hours: HourPoint[]): ResortForecast {
  return { id: 'test', name: '测试雪场', short: '测试', region: '崇礼', area: '测试', lat: 40, lon: 115, baseElev: 1600, peakElev: 2100, hourly: hours }
}

function dayHours(date: string, fill: Partial<AirPoint> = {}): HourPoint[] {
  return Array.from({ length: 9 }, (_, i) => hour(`${date}T${String(i + 8).padStart(2, '0')}:00`, fill))
}

describe('hourTier', () => {
  it('classifies the four levels at boundaries', () => {
    expect(hourTier(hour('2026-11-18T10:00', { vis: 5000, wind: 28, gust: 44, feels: -20, snow: 0, code: 1 }))).toBe('great')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 4999, wind: 28, gust: 44, feels: -20 }))).toBe('okay')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 1999, wind: 28, gust: 44, feels: -20 }))).toBe('poor')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 500, wind: 28, gust: 44, feels: -20 }))).toBe('poor')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 499, wind: 28, gust: 44, feels: -20 }))).toBe('hell')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 10000, wind: 39, gust: 44, feels: -20 }))).toBe('poor')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 10000, wind: 50, gust: 44, feels: -20 }))).toBe('hell')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 10000, wind: 20, gust: 60, feels: -20 }))).toBe('poor')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 10000, wind: 20, gust: 75, feels: -20 }))).toBe('hell')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 10000, wind: 20, gust: 30, feels: -26 }))).toBe('poor')
    expect(hourTier(hour('2026-11-18T10:00', { vis: 10000, wind: 20, gust: 30, feels: -30 }))).toBe('hell')
  })
})

describe('dailyFor', () => {
  it('uses the 2-hour hell rule and 3-hour poor rule', () => {
    const mostlyGood = dayHours('2026-11-18')
    const twoHell = mostlyGood.map((h, i) => i < 2 ? hour(h.time, { gust: 80 }) : h)
    expect(dailyFor(resort(twoHell), '2026-11-18').tier).toBe('hell')

    const threePoor = mostlyGood.map((h, i) => i < 3 ? hour(h.time, { gust: 65 }) : h)
    expect(dailyFor(resort(threePoor), '2026-11-18').tier).toBe('poor')

    const fiveGreat = mostlyGood.map((h, i) => i < 5 ? hour(h.time, { vis: 8000, wind: 10, gust: 20, feels: -15 }) : h)
    expect(dailyFor(resort(fiveGreat), '2026-11-18').tier).toBe('great')
  })

  it('downgrades a single bad hour to okay, not hell', () => {
    const hours = dayHours('2026-11-18', { vis: 8000, wind: 10, gust: 20, feels: -15 })
    hours[4] = hour(hours[4].time, { gust: 80 })
    expect(dailyFor(resort(hours), '2026-11-18').tier).toBe('okay')
  })
})

describe('score and better window', () => {
  it('caps hell score at 24', () => {
    const h = hour('2026-11-18T10:00', { gust: 80 })
    expect(hourTier(h)).toBe('hell')
    expect(overallScore(h)).toBeLessThanOrEqual(24)
    expect(dailyScore({ ...dailyFor(resort(dayHours('2026-11-18', { gust: 80 })), '2026-11-18') })).toBeLessThanOrEqual(24)
  })

  it('skips past windows and finds a future improvement', () => {
    const hours = Array.from({ length: 18 }, (_, i) => {
      const hh = String(i < 9 ? 8 + i : 8 + (i - 9)).padStart(2, '0')
      return hour(`2026-11-18T${hh}:00`, { gust: i < 2 ? 80 : 30, wind: i < 2 ? 55 : 10 })
    })
    // 08-09 hell, 10:00+ great; at 10:30 should not suggest 08-10 again
    const daily = dailyFor(resort(hours), '2026-11-18')
    const result = betterWindow(resort(hours), daily, 0, 10 * 60 + 30)
    expect(result).not.toContain('08:00')
  })
})
