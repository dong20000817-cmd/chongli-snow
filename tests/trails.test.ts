import { describe, expect, it } from 'vitest'
import { RESORTS } from '../src/data/resorts'
import {
  GRADE_ORDER,
  STATUS_ORDER,
  TRAILS,
  TRAIL_TOTAL,
  buildTrailDigest,
  clearDay,
  countStatuses,
  createEmptyBook,
  emptyDay,
  ensureDay,
  isOpened,
  isSplit,
  markMany,
  markTrail,
  migrateBook,
  openedCount,
  resetResort,
  statusOf,
  toggleSplit,
  trailLen,
  trailPosterFilename,
  unitsForResort,
} from '../src/lib/trails'

const D = '2026-11-22'

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

  it('uses the official levels corrected against the resort maps', () => {
    const tw = Object.fromEntries(TRAILS.resorts.thaiwoo.trails.map(t => [t.name, t]))
    expect(tw['4B-波尔卡'].grade).toBe('black')
    expect(tw['4B-波尔卡'].level).toBe('高级')
    expect(tw['4I-迪斯科'].grade).toBe('black')
    expect(tw['10D-现代舞'].grade).toBe('double')

    const fl = Object.fromEntries(TRAILS.resorts.fulong.trails.map(t => [t.name, t]))
    expect(fl['B9-摇摆'].grade).toBe('black')
    expect(fl['B9-摇摆'].level).toBe('高级')
    expect(fl['B6-乡村'].level).toBe('中高级')
    expect(fl['B2-交响'].level).toBe('初中级')

    expect(TRAILS.resorts.wanlong.trails.some(t => t.name === '雨龙道')).toBe(true)
  })

  it('formats lengths', () => {
    expect(trailLen(4.16)).toBe('4.2 km')
    expect(trailLen(0.226)).toBe('226 m')
    expect(trailLen(0)).toBe('')
  })
})

describe('long-term opened memory', () => {
  it('keeps opened trails across days and stores no daily mark', () => {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '长龙道', 'open')
    expect(isOpened(book, 'wanlong', '长龙道')).toBe(true)
    expect(book.days[D].marks.wanlong).toBeUndefined()

    const next = ensureDay(book, '2026-11-23')
    expect(statusOf(next.book, next.day, 'wanlong', '长龙道')).toBe('open')
    expect(next.carried).toBe(0)
  })

  it('treats closed / snow / training as today-only exceptions', () => {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '长龙道', 'open')
    book = markTrail(book, D, 'wanlong', '长龙道', 'closed')
    expect(countStatuses(book, book.days[D], 'wanlong').closed).toBe(1)

    const next = ensureDay(book, '2026-11-23')
    expect(countStatuses(next.book, next.day, 'wanlong').closed).toBe(0)
    expect(statusOf(next.book, next.day, 'wanlong', '长龙道')).toBe('open')
  })

  it('turns 明日预计开放 into 今日新开 and opened the next day', () => {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '游龙道', 'tomorrow')
    expect(isOpened(book, 'wanlong', '游龙道')).toBe(false)

    const next = ensureDay(book, '2026-11-23')
    expect(next.carried).toBe(1)
    expect(next.day.marks.wanlong?.['游龙道']).toBe('new')
    expect(isOpened(next.book, 'wanlong', '游龙道')).toBe(true)
  })

  it('does not carry across a gap of more than one day', () => {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '游龙道', 'tomorrow')
    const skipped = ensureDay(book, '2026-11-24')
    expect(skipped.carried).toBe(0)
    expect(skipped.day.marks).toEqual({})
  })

  it('clears today without touching opened, and resets a resort on demand', () => {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '长龙道', 'open')
    book = markTrail(book, D, 'wanlong', '银龙道', 'snow')
    book = clearDay(book, D, 'wanlong')
    expect(book.days[D].marks.wanlong).toBeUndefined()
    expect(isOpened(book, 'wanlong', '长龙道')).toBe(true)

    book = resetResort(book, 'wanlong')
    expect(isOpened(book, 'wanlong', '长龙道')).toBe(false)
  })

  it('bulk-marks all trails of a resort as opened', () => {
    let book = createEmptyBook()
    const keys = unitsForResort(book, 'wanlong').map(u => u.key)
    book = markMany(book, D, 'wanlong', keys, 'open')
    expect(openedCount(book, 'wanlong')).toBe(32)
  })
})

describe('v1 → v2 migration', () => {
  it('turns old per-day open marks into long-term opened', () => {
    const v1 = {
      version: 1,
      days: {
        '2026-11-21': { date: '2026-11-21', marks: { wanlong: { 长龙道: 'open' } }, done: {}, updatedAt: '2026-11-21T18:00' },
        '2026-11-22': {
          date: '2026-11-22',
          marks: { wanlong: { 长龙道: 'open', 游龙道: 'new', 银龙道: 'closed' }, genting: { 曼陀罗: 'tomorrow' } },
          done: { wanlong: true },
          updatedAt: '2026-11-22T18:00',
        },
      },
    }
    const book = migrateBook(v1)!
    expect(book.version).toBe(2)
    expect(book.opened.wanlong).toEqual({ 长龙道: true, 游龙道: true })
    expect(book.days['2026-11-22'].marks.wanlong).toEqual({ 游龙道: 'new', 银龙道: 'closed' })
    expect(book.days['2026-11-22'].done.wanlong).toBe(true)
    expect(book.days['2026-11-21'].done).toEqual({})
  })
})

describe('upper / lower sections', () => {
  it('splits a trail into 上段/下段 and keeps the opened state', () => {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '银龙道', 'open')
    book = toggleSplit(book, D, 'wanlong', '银龙道')
    expect(isSplit(book, 'wanlong', '银龙道')).toBe(true)
    expect(unitsForResort(book, 'wanlong').filter(u => u.trail.name === '银龙道')).toHaveLength(2)
    expect(isOpened(book, 'wanlong', '银龙道|上段')).toBe(true)
    expect(isOpened(book, 'wanlong', '银龙道|下段')).toBe(true)

    book = markTrail(book, D, 'wanlong', '银龙道|上段', 'snow')
    expect(countStatuses(book, book.days[D], 'wanlong').snow).toBe(1)

    book = toggleSplit(book, D, 'wanlong', '银龙道')
    expect(isSplit(book, 'wanlong', '银龙道')).toBe(false)
    expect(unitsForResort(book, 'wanlong').filter(u => u.trail.name === '银龙道')).toHaveLength(1)
    expect(isOpened(book, 'wanlong', '银龙道')).toBe(true)
    expect(countStatuses(book, book.days[D], 'wanlong').snow).toBe(1)
  })

  it('pre-marks 金山岭 北极星 as two sections in the dataset', () => {
    const star = TRAILS.resorts.jinshanling.trails.find(t => t.name === '北极星')!
    expect(star.segments).toEqual(['上段', '下段'])
  })
})

describe('trail digest', () => {
  function sampleBook() {
    let book = createEmptyBook()
    book = markTrail(book, D, 'wanlong', '长龙道', 'open')
    book = markTrail(book, D, 'wanlong', '游龙道', 'new')
    book = markTrail(book, D, 'wanlong', '银龙道', 'snow')
    book = markTrail(book, D, 'genting', '曼陀罗', 'closed')
    return book
  }

  it('only includes resorts that have opened or marked trails', () => {
    const book = sampleBook()
    const digest = buildTrailDigest(book, book.days[D], D, '07:30')
    expect(digest.rows.map(r => r.resort.id)).toEqual(['wanlong', 'genting'])
    expect(digest.rows[0].opened).toBe(2)
    expect(digest.totals.new).toBe(1)
    expect(digest.totals.snow).toBe(1)
    expect(digest.totals.closed).toBe(1)
    expect(digest.anyMarks).toBe(true)
    expect(digest.dateLabel).toBe('11/22 周日')
  })

  it('keeps full names for every change group', () => {
    const book = sampleBook()
    const digest = buildTrailDigest(book, book.days[D], D, '07:30')
    const row = digest.rows[0]
    const labels = row.groups.map(g => `${g.status}:${g.names.join(',')}`)
    expect(labels).toContain('new:游龙道')
    expect(labels).toContain('snow:银龙道')
    expect(row.groups.find(g => g.status === 'snow')?.names).toEqual(['银龙道'])
  })

  it('supports excluding a resort from the poster', () => {
    const book = sampleBook()
    const digest = buildTrailDigest(book, book.days[D], D, '07:30', ['genting'])
    expect(digest.rows).toHaveLength(1)
    expect(digest.rows[0].resort.id).toBe('wanlong')
  })

  it('is empty but valid before any input', () => {
    const digest = buildTrailDigest(createEmptyBook(), emptyDay(D), D, '07:30')
    expect(digest.anyMarks).toBe(false)
    expect(digest.rows).toHaveLength(0)
    expect(digest.openedTotal).toBe(0)
    expect(STATUS_ORDER).toHaveLength(6)
    expect(trailPosterFilename(digest, '3:4', 900)).toContain('3x4-1080x1800')
  })
})
