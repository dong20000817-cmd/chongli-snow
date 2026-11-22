import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Snapshot } from '../lib/types'
import { RESORTS } from '../data/resorts'
import { Icon } from '../components/Icons'
import {
  GRADE_META,
  STATUS_META,
  STATUS_ORDER,
  TRAILS,
  clearDay,
  countStatuses,
  emptyDay,
  levelOf,
  showLevel,
  loadBook,
  markMany,
  markTrail,
  nextPendingResort,
  openedCount,
  resetResort,
  saveBook,
  setResortDone,
  toggleSplit,
  trailLen,
  unitsByGrade,
  unitsForResort,
  isSplit,
  statusOf,
  type TrailBook,
  type TrailDay,
  type TrailStatus,
  type TrailUnit,
} from '../lib/trails'

function todayLabel(date: string): string {
  return `${date.slice(5).replace('-', '/')} 周${'日一二三四五六'[new Date(`${date}T12:00:00+08:00`).getDay()]}`
}

export function TrailsScreen({ snapshot, resortId }: { snapshot: Snapshot; resortId: string }) {
  const today = snapshot.today
  const [book, setBook] = useState<TrailBook | null>(null)
  const [day, setDay] = useState<TrailDay | null>(null)
  const [carried, setCarried] = useState(0)
  const [selected, setSelected] = useState(resortId in TRAILS.resorts ? resortId : RESORTS[0].id)
  const [brush, setBrush] = useState<TrailStatus>('new')
  const [onlyChanged, setOnlyChanged] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const bookRef = useRef<TrailBook | null>(null)
  const dayRef = useRef<TrailDay | null>(null)

  useEffect(() => {
    const loaded = loadBook(today)
    bookRef.current = loaded.book
    dayRef.current = loaded.day
    setBook(loaded.book)
    setDay(loaded.day)
    setCarried(loaded.carried)
  }, [today])

  const flash = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2400)
  }

  const commit = (next: TrailBook) => {
    saveBook(next)
    bookRef.current = next
    dayRef.current = next.days[today] ?? emptyDay(today)
    setBook(next)
    setDay(dayRef.current)
  }

  const current = day ?? emptyDay(today)
  const data = TRAILS.resorts[selected]
  const units = useMemo(() => (book ? unitsForResort(book, selected) : []), [book, selected])
  const sections = useMemo(() => (book ? unitsByGrade(book, selected) : []), [book, selected])
  const counts = book ? countStatuses(book, current, selected) : null
  const opened = book ? openedCount(book, selected) : 0
  const total = units.length
  const unitWord = units.some(u => u.seg) ? '段' : '条'
  const doneCount = RESORTS.filter(r => current.done[r.id]).length
  const openedAll = book ? RESORTS.reduce((n, r) => n + openedCount(book, r.id), 0) : 0
  const changed = book ? countStatuses(book, current) : null
  const done = Boolean(current.done[selected])

  const latestBook = (): TrailBook => bookRef.current ?? { version: 2, opened: {}, splits: {}, days: {} }
  const latestDay = (): TrailDay => dayRef.current ?? emptyDay(today)

  const setStatus = (key: string, status: TrailStatus | null) => {
    const b = latestBook()
    const d = latestDay()
    const cur = statusOf(b, d, selected, key)
    commit(markTrail(b, today, selected, key, cur === status ? null : status))
  }

  const markAll = (status: TrailStatus | null) => {
    const keys = units.map(u => u.key)
    commit(markMany(latestBook(), today, selected, keys, status))
    flash(status === 'open' ? `已把 ${keys.length} 条加入“已开放”长期记忆` : '已清空本家今日变化')
  }

  const clearToday = () => {
    commit(clearDay(latestBook(), today, selected))
    flash('已清空今日变化 · 已开放的长期记忆保留')
  }

  const reset = () => {
    if (!window.confirm('重置本家的“已开放”记忆和所有标注？此操作不可恢复。')) return
    commit(resetResort(latestBook(), selected))
    flash('已重置本家')
  }

  const finish = () => {
    const b = latestBook()
    const d = latestDay()
    const next = nextPendingResort(d, selected)
    commit(setResortDone(b, today, selected, true))
    if (next !== selected) setSelected(next)
    const left = RESORTS.filter(r => r.id !== selected && !d.done[r.id]).length
    flash(left ? `本家已录完 · 下一家 ${TRAILS.resorts[next]?.short ?? ''}` : '8 家全部录完，可以出情报图了')
  }

  const renderRow = (unit: TrailUnit) => {
    const status = book ? statusOf(book, current, selected, unit.key) : undefined
    const meta = status ? STATUS_META[status] : null
    const split = isSplit(book ?? latestBook(), selected, unit.trail.name)
    const isFirstSeg = split && unit.seg === (unit.trail.segments ?? ['上段', '下段'])[0]
    const label = unit.seg ? `${unit.trail.name}（${unit.seg}）` : unit.trail.name
    const level = levelOf(unit.trail)
    const showBadge = showLevel(unit.trail)
    return (
      <div className={`tr-trail${unit.seg ? ' sub' : ''}`} key={unit.key}>
        <button className="tr-trail-main" onClick={() => setStatus(unit.key, brush)} aria-pressed={Boolean(status)}>
          <span className="trail-color" style={{ background: GRADE_META[unit.grade].color }} />
          <span className="trail-main">
            <span className="trail-name">{label}{showBadge && <i className="tr-level">{level}</i>}</span>
            <span className="trail-meta">{[trailLen(unit.trail.len), unit.trail.note].filter(Boolean).join(' · ') || '—'}</span>
          </span>
          <span
            className="tr-status"
            style={status && meta ? { color: meta.color, background: `${meta.color}1c`, border: `1px solid ${meta.color}33` } : undefined}
          >
            {status && meta ? meta.label : '未标'}
          </span>
        </button>
        {(isFirstSeg || !split) && (
          <button className={`tr-split${split ? ' on' : ''}`} onClick={() => commit(toggleSplit(latestBook(), today, selected, unit.trail.name))}>
            {split ? '合' : '段'}
          </button>
        )}
      </div>
    )
  }

  return (
    <main className="screen with-tabs tr-screen">
      <div className="tr-head">
        <a className="dev-back" href={`#/snow/${selected}`} aria-label="返回雪道页"><Icon name="back" size={16} /></a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tr-title">雪道情报录入</div>
          <div className="tr-sub">{todayLabel(today)} · 已录 {doneCount}/8 家 · 已开放 {openedAll} 条</div>
        </div>
        <a className="tr-poster-link" href="#/trailposter">情报图</a>
      </div>

      <div className="tr-progress"><i style={{ width: `${(doneCount / RESORTS.length) * 100}%` }} /></div>

      {carried > 0 && (
        <div className="advice" style={{ marginTop: 10 }}>
          <b>已顺延：</b>昨天标记的 {carried} 条“明日预计开放”，今天已自动变成“今日新开”，并加入已开放。
        </div>
      )}

      <div className="tr-resort-tabs">
        {RESORTS.map(r => {
          const n = book ? countStatuses(book, current, r.id) : null
          const changes = n ? n.new + n.tomorrow + n.snow + n.training + n.closed : 0
          return (
            <button
              key={r.id}
              className={`tr-rt${selected === r.id ? ' on' : ''}${current.done[r.id] ? ' done' : ''}`}
              onClick={() => setSelected(r.id)}
            >
              {r.short}
              {current.done[r.id] ? <em>✓</em> : changes > 0 ? <em className="num">{changes}</em> : null}
            </button>
          )
        })}
      </div>

      {data && (
        <section className="tr-resort">
          <div className="tr-resort-top">
            <div>
              <div className="tr-resort-name">{data.name}</div>
              <div className="tr-resort-meta">{total} {unitWord} · {data.note}</div>
            </div>
            <button className={`tr-done-btn${done ? ' on' : ''}`} onClick={() => commit(setResortDone(latestBook(), today, selected, !done))}>
              {done ? '已录完 ✓' : '标为录完'}
            </button>
          </div>
          <div className="tr-opened">
            <span>已开放 <b>{opened}</b> / {total} {unitWord}</span>
            <span className="tr-opened-actions">
              {changed && <i onClick={clearToday}>清空今日变化</i>}
              <i onClick={reset}>重置本家</i>
            </span>
          </div>
          <div className="tr-counts">
            {STATUS_ORDER.map(s => (
              <span key={s} className={`tr-count${counts?.[s] ? '' : ' zero'}`} style={{ color: STATUS_META[s].color }}>
                {STATUS_META[s].short}<b>{counts?.[s] ?? 0}</b>
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="tr-brush">
        <div className="tr-brush-head">
          <span>点雪道＝标成</span>
          <span className="tr-brush-hint">再点一次取消；“已开放”会长期记着</span>
        </div>
        <div className="tr-brush-row">
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              className={`tr-brush-btn${brush === s ? ' on' : ''}`}
              style={{ '--sc': STATUS_META[s].color } as CSSProperties}
              onClick={() => setBrush(s)}
            >
              <i />
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="tr-quick">
        <button onClick={() => markAll('open')}>全部开放</button>
        <button onClick={clearToday}>清空今日</button>
        <button className={onlyChanged ? 'on' : ''} onClick={() => setOnlyChanged(v => !v)}>只看变化</button>
      </div>

      {sections.map(({ grade, units: gradeUnits }) => {
        const visible = onlyChanged
          ? gradeUnits.filter(u => book && current.marks[selected]?.[u.key])
          : gradeUnits
        if (!visible.length) return null
        const openedIn = gradeUnits.filter(u => book && statusOf(book, current, selected, u.key) === 'open').length
        return (
          <section className="cat-section" key={grade}>
            <div className="cat-head">
              <div className="cat-title">
                <span className="dot" style={{ background: GRADE_META[grade].color }} />
                {GRADE_META[grade].label}
                <small>{GRADE_META[grade].sub}</small>
              </div>
              <span className="cat-count" style={{ color: GRADE_META[grade].color, background: `${GRADE_META[grade].color}1f`, border: `1px solid ${GRADE_META[grade].color}33` }}>
                {openedIn} / {gradeUnits.length} 已开放
              </span>
            </div>
            <div className="trail-list">{visible.map(renderRow)}</div>
          </section>
        )
      })}

      <div className="tr-tip">
        “已开放”会长期保留，不用每天重标；每天只需要加“今日新开 / 明日预计开放”，以及当天的补雪、训练、临时关闭。
        “明日预计开放”第二天会自动变成“今日新开”；补雪、训练、关闭只影响当天。
      </div>

      <div className="tr-actions">
        <a className="primary" href="#/trailposter">查看情报图</a>
        <button onClick={finish}>{done ? '下一家 →' : '录完 · 下一家'}</button>
      </div>

      {toast && <div className="dev-toast">{toast}</div>}
    </main>
  )
}
