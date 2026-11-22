import { describe, expect, it } from 'vitest'
import { RESORTS } from '../src/data/resorts'
import {
  GRADE_ORDER,
  STATUS_ORDER,
  TRAILS,
  TRAIL_TOTAL,
  buildTrailDigest,
  digestLine,
  emptyDay,
  ensureDay,
  markedCount,
  setManyStatus,
  setResortDone,
  setTrailStatus,
  toggleTrail,
  trailLen,
  trailPosterFilename,
} from '../src/lib/trails'

describe('trail dataset', () => {
  it('covers all 8 resorts', () => {
    for (const r of RESORTS) expect(TRAILS.resorts[r.id], r.id).toBeTruthy()
    expect(TRAIL_TOTAL).toBe(191)
  })

  it('keeps the researched trail count per resort', () => {
    const expected: Record<string, number> = {
      wanlong: 32, genting: 32, thaiwoo: 22, fulong: 33, galaxy: 12, dolomiti: 9, xueruyi: 31, jinshanling: 20,
    }
    for (const [id, n] of Object.entries(expected)) {
      expect(TRAILS.resorts[id].trails, id).toHaveLength(n)
    }
  })

  it('has unique names and valid grades', () => {
    for (const [id, data] of Object.entries(TRAILS.resorts)) {
      const names = data.trails.map(t => t.name)
      expect(new Set(names).size, id).toBe(names.length)
      for (const t of data.trails) expect(GRADE_ORDER).toContain(t.grade)
    }
  })

  it('only 雪如意 uses red trails, and it also has its own black expert runs', () => {
    const red = Object.entries(TRAILS.resorts).filter(([, d]) => d.trails.some(t => t.grade === 'red')).map(([id]) => id)
    expect(red).toEqual(['xueruyi'])
    expect(TRAILS.resorts.xueruyi.trails.filter(t => t.grade === 'red').map(t => t.name)).toEqual(['A3', 'A5', 'B9', 'C5'])
    expect(TRAILS.resorts.xueruyi.trails.filter(t => t.grade === 'black').map(t => t.name)).toEqual(['D2', 'D3', 'D5'])
  })

  it('formats lengths', () => {
    expect(trailLen(4.16)).toBe('4.2 km')
    expect(trailLen(0.226)).toBe('226 m')
    expect(trailLen(0)).toBe('')
  })
})

function sampleDay() {
  return emptyDay('2026-11-22')
}

describe('manual trail book', () => {
  it('carries only “明日预计” into the next day as “今日新开”', () => {
    let day = sampleDay()
    day = setTrailStatus(day, 'wanlong', '长龙道', 'tomorrow')
    day = setTrailStatus(day, 'wanlong', '银龙道', 'snow')
    day = setTrailStatus(day, 'wanlong', '风龙道', 'closed')
    day = setResortDone(day, 'wanlong', true)

    const book = { version: 1 as const, days: { '2026-11-22': day } }
    const next = ensureDay(book, '2026-11-23')
    expect(next.carried).toBe(1)
    expect(next.day.marks.wanlong).toEqual({ 长龙道: 'new' })
    expect(next.day.done).toEqual({})
  })

  it('does not carry across a gap of more than one day', () => {
    let day = sampleDay()
    day = setTrailStatus(day, 'wanlong', '长龙道', 'tomorrow')
    const book = { version: 1 as const, days: { '2026-11-22': day } }
    const skipped = ensureDay(book, '2026-11-24')
    expect(skipped.carried).toBe(0)
    expect(skipped.day.marks).toEqual({})
  })

  it('does not overwrite an existing day', () => {
    let day = sampleDay()
    day = setTrailStatus(day, 'genting', '曼陀罗', 'open')
    const book = { version: 1 as const, days: { '2026-11-22': day } }
    const same = ensureDay(book, '2026-11-22')
    expect(same.book).toBe(book)
    expect(same.carried).toBe(0)
    expect(same.day.marks.genting).toEqual({ 曼陀罗: 'open' })
  })

  it('toggles a mark off and bulk-marks a resort', () => {
    let day = sampleDay()
    day = toggleTrail(day, 'wanlong', '长龙道', 'new')
    expect(day.marks.wanlong?.['长龙道']).toBe('new')
    day = toggleTrail(day, 'wanlong', '长龙道', 'new')
    expect(day.marks.wanlong?.['长龙道']).toBeUndefined()

    const names = TRAILS.resorts.wanlong.trails.map(t => t.name)
    day = setManyStatus(day, 'wanlong', names, 'open')
    expect(markedCount(day, 'wanlong')).toBe(32)
    day = setManyStatus(day, 'wanlong', names, null)
    expect(day.marks.wanlong).toBeUndefined()
  })

  it('builds a per-resort summary and keeps 未录入 rows', () => {
    let day = sampleDay()
    day = setTrailStatus(day, 'wanlong', '长龙道', 'new')
    day = setTrailStatus(day, 'wanlong', '银龙道', 'snow')
    day = setTrailStatus(day, 'genting', '曼陀罗', 'closed')
    day = setResortDone(day, 'wanlong', true)

    const digest = buildTrailDigest(day, '2026-11-22', '07:30')
    const wanlong = digest.rows.find(r => r.resort.id === 'wanlong')!
    expect(wanlong.done).toBe(true)
    expect(wanlong.marked).toBe(2)
    expect(wanlong.openCount).toBe(2)
    expect(digest.totals.new).toBe(1)
    expect(digest.totals.snow).toBe(1)
    expect(digest.totals.closed).toBe(1)
    expect(digest.markedResorts).toBe(2)
    expect(digest.doneCount).toBe(1)
    expect(digest.anyMarks).toBe(true)
    expect(digest.rows.filter(r => !r.marked)).toHaveLength(6)
    expect(digestLine(wanlong)).toContain('新·长龙道')
    expect(digest.dateLabel).toBe('11/22 周日')
  })

  it('is empty but valid before any input', () => {
    const digest = buildTrailDigest(emptyDay('2026-11-22'), '2026-11-22', '07:30')
    expect(digest.anyMarks).toBe(false)
    expect(digest.markedTrails).toBe(0)
    expect(digest.rows).toHaveLength(8)
    expect(digest.rows.every(r => !r.marked)).toBe(true)
    expect(STATUS_ORDER).toHaveLength(6)
    expect(trailPosterFilename(digest, '3:4')).toContain('3x4')
  })
})
