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
  TRAIL_TOTAL,
  countStatuses,
  emptyDay,
  isSkiable,
  loadBook,
  markedCount,
  nextPendingResort,
  saveDay,
  setManyStatus,
  setResortDone,
  toggleTrail,
  trailByGrade,
  trailLen,
  type TrailBook,
  type TrailDay,
  type TrailStatus,
} from '../lib/trails'

function todayLabel(date: string): string {
  return `${date.slice(5).replace('-', '/')} 周${'日一二三四五六'[new Date(`${date}T12:00:00+08:00`).getDay()]}`
}

export function TrailsScreen({ snapshot, resortId }: { snapshot: Snapshot; resortId: string }) {
  const today = snapshot.today
  const [day, setDay] = useState<TrailDay | null>(null)
  const [carried, setCarried] = useState(0)
  const [selected, setSelected] = useState(resortId in TRAILS.resorts ? resortId : RESORTS[0].id)
  const [brush, setBrush] = useState<TrailStatus>('new')
  const [onlyMarked, setOnlyMarked] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const bookRef = useRef<TrailBook | null>(null)
  const dayRef = useRef<TrailDay | null>(null)

  useEffect(() => {
    const loaded = loadBook(today)
    bookRef.current = loaded.book
    dayRef.current = loaded.day
    setDay(loaded.day)
    setCarried(loaded.carried)
  }, [today])

  const flash = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2400)
  }

  const commit = (next: TrailDay) => {
    const base = bookRef.current ?? { version: 1 as const, days: {} }
    const nb = saveDay(base, next)
    bookRef.current = nb
    dayRef.current = next
    setDay(next)
  }

  const current = day ?? emptyDay(today)
  const marks = current.marks[selected] ?? {}
  const counts = countStatuses(current, selected)
  const data = TRAILS.resorts[selected]
  const sections = useMemo(() => trailByGrade(selected), [selected])
  const doneCount = RESORTS.filter(r => current.done[r.id]).length
  const totalMarked = markedCount(current)
  const done = Boolean(current.done[selected])

  /** 所有改动都从 ref 里的最新一天算，连点两条雪道也不会互相覆盖。 */
  const latest = (): TrailDay => dayRef.current ?? emptyDay(today)

  const markAll = (status: TrailStatus | null) => {
    const names = data?.trails.map(t => t.name) ?? []
    commit(setManyStatus(latest(), selected, names, status))
    flash(status === 'open' ? `已把 ${names.length} 条标为开放，再点掉例外` : '已清空本家标注')
  }

  const toggleRow = (name: string) => {
    commit(toggleTrail(latest(), selected, name, brush))
  }

  const toggleDone = () => {
    commit(setResortDone(latest(), selected, !done))
  }

  const finish = () => {
    const d = latest()
    const next = nextPendingResort(d, selected)
    commit(setResortDone(d, selected, true))
    if (next !== selected) setSelected(next)
    const left = RESORTS.filter(r => r.id !== selected && !d.done[r.id]).length
    flash(left ? `本家已录完 · 下一家 ${TRAILS.resorts[next]?.short ?? ''}` : '8 家全部录完，可以出情报图了')
  }

  return (
    <main className="screen with-tabs tr-screen">
      <div className="tr-head">
        <a className="dev-back" href={`#/snow/${selected}`} aria-label="返回雪道页"><Icon name="back" size={16} /></a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tr-title">雪道情报录入</div>
          <div className="tr-sub">{todayLabel(today)} · 已录 {doneCount}/8 家 · 标注 {totalMarked}/{TRAIL_TOTAL} 条</div>
        </div>
        <a className="tr-poster-link" href="#/trailposter">情报图</a>
      </div>

      <div className="tr-progress"><i style={{ width: `${(doneCount / RESORTS.length) * 100}%` }} /></div>

      {carried > 0 && (
        <div className="advice" style={{ marginTop: 10 }}>
          <b>已顺延：</b>昨天标记的 {carried} 条“明日预计”，今天已自动变成“今日新开”，核对一下就行。
        </div>
      )}

      <div className="tr-resort-tabs">
        {RESORTS.map(r => {
          const n = markedCount(current, r.id)
          return (
            <button
              key={r.id}
              className={`tr-rt${selected === r.id ? ' on' : ''}${current.done[r.id] ? ' done' : ''}`}
              onClick={() => setSelected(r.id)}
            >
              {r.short}
              {current.done[r.id] ? <em>✓</em> : n > 0 ? <em className="num">{n}</em> : null}
            </button>
          )
        })}
      </div>

      {data && (
        <section className="tr-resort">
          <div className="tr-resort-top">
            <div>
              <div className="tr-resort-name">{data.name}</div>
              <div className="tr-resort-meta">{data.trails.length} 条 · {data.note}</div>
            </div>
            <button className={`tr-done-btn${done ? ' on' : ''}`} onClick={toggleDone}>
              {done ? '已录完 ✓' : '标为录完'}
            </button>
          </div>
          <div className="tr-counts">
            {STATUS_ORDER.map(s => (
              <span key={s} className={`tr-count${counts[s] ? '' : ' zero'}`} style={{ color: STATUS_META[s].color }}>
                {STATUS_META[s].short}<b>{counts[s]}</b>
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="tr-brush">
        <div className="tr-brush-head">
          <span>点雪道＝标成</span>
          <span className="tr-brush-hint">再点一次取消</span>
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
        <button onClick={() => markAll(null)}>清空本家</button>
        <button className={onlyMarked ? 'on' : ''} onClick={() => setOnlyMarked(v => !v)}>只看已标</button>
      </div>

      {sections.map(({ grade, trails }) => {
        const visible = onlyMarked ? trails.filter(t => marks[t.name]) : trails
        if (!visible.length) return null
        const color = GRADE_META[grade].color
        const open = trails.filter(t => marks[t.name] && isSkiable(marks[t.name]!)).length
        return (
          <section className="cat-section" key={grade}>
            <div className="cat-head">
              <div className="cat-title">
                <span className="dot" style={{ background: color }} />
                {GRADE_META[grade].label}
                <small>{GRADE_META[grade].sub}</small>
              </div>
              <span className="cat-count" style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}>
                {open} / {trails.length} 可滑
              </span>
            </div>
            <div className="trail-list">
              {visible.map(t => {
                const st = marks[t.name]
                const meta = st ? STATUS_META[st] : null
                return (
                  <button
                    key={t.name}
                    className={`tr-trail${st ? ` st-${st}` : ''}`}
                    onClick={() => toggleRow(t.name)}
                    aria-pressed={Boolean(st)}
                  >
                    <span className="trail-color" style={{ background: color }} />
                    <span className="trail-main">
                      <span className="trail-name">{t.name}</span>
                      <span className="trail-meta">{[trailLen(t.len), t.note].filter(Boolean).join(' · ') || '—'}</span>
                    </span>
                    <span
                      className="tr-status"
                      style={st && meta ? { color: meta.color, background: `${meta.color}1c`, border: `1px solid ${meta.color}33` } : undefined}
                    >
                      {st && meta ? meta.label : '未标'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="tr-tip">
        “明日预计”明天会自动顺延成“今日新开”；补雪、训练、临时关闭只影响当天，不会被继承。
      </div>

      <div className="tr-actions">
        <a className="primary" href="#/trailposter">查看情报图</a>
        <button onClick={finish}>{done ? '下一家 →' : '录完 · 下一家'}</button>
      </div>

      {toast && <div className="dev-toast">{toast}</div>}
    </main>
  )
}
