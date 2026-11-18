import { describe, expect, it } from 'vitest'
import { buildApiUrl } from '../src/lib/api'
import { RESORTS } from '../src/data/resorts'

describe('buildApiUrl', () => {
  it('requests base and peak for all 8 resorts in one call', () => {
    const url = buildApiUrl()
    const p = new URL(url).searchParams
    expect(p.get('latitude')?.split(',')).toHaveLength(RESORTS.length * 2)
    expect(p.get('elevation')?.split(',')).toHaveLength(RESORTS.length * 2)
    expect(p.get('forecast_days')).toBe('7')
    expect(p.get('timezone')).toBe('Asia/Shanghai')
    expect(p.get('hourly')).toContain('visibility')
    expect(p.get('hourly')).toContain('wind_gusts_10m')
  })
})
