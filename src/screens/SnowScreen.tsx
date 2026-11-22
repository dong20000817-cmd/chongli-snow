import { useEffect, useState } from 'react'
import type { ResortForecast } from '../lib/types'
import { Icon } from '../components/Icons'
import {
  GRADE_META,
  STATUS_META,
  TRAILS,
  blankCounts,
  countStatuses,
  levelOf,
  showLevel,
  loadBook,
  openedCount,
  trailLen,
  unitsByGrade,
  unitsForResort,
  statusOf,
  type Grade,
  type TrailBook,
  type TrailDay,
  type TrailStatus,
} from '../lib/trails'

type Filter = 'all' | Grade

function statusPill(status: TrailStatus | undefined) {
  if (!status) return <span className="tr-status">未标</span>
  const m = STATUS_META[status]
  return (
    <span className="tr-status" style={{ color: m.color, background: `${m.color}1c`, border: `1px solid ${m.color}33` }}>
      {m.label}
    </span>
  )
}

export function SnowScreen({ resort, today }: { resort: ResortForecast; today: string }) {
  const data = TRAILS.resorts[resort.id]
  const [book, setBook] = useState<TrailBook | null>(null)
  const [day, setDay] = useState<TrailDay | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const loaded = loadBook(today)
    setBook(loaded.book)
    setDay(loaded.day)
    setFilter('all')
  }, [today, resort.id])

  if (!data) {
    return (
      <main className="screen with-tabs">
        <div className="page-head"><span className="left"><Icon name="pin" size={11} />{resort.region} · {resort.area.split(' · ')[0]}</span><span className="right">暂无数据</span></div>
        <div className="page-title">雪道开放</div>
        <div className="page-sub">{resort.name} · 雪道清单待补充</div>
      </main>
    )
  }

  const current = day ?? { date: today, marks: {}, done: {}, updatedAt: '' }
  const units = book ? unitsForResort(book, resort.id) : []
  const sections = book ? unitsByGrade(book, resort.id) : []
  const counts = book ? countStatuses(book, current, resort.id) : blankCounts()
  const opened = book ? openedCount(book, resort.id) : 0
  const marked = Object.keys(current.marks[resort.id] ?? {}).length
  const skiable = (['open', 'new', 'snow', 'training'] as const).reduce((n, s) => n + counts[s], 0)
  const total = units.length || data.trails.length
  const visible = filter === 'all' ? sections : sections.filter(s => s.grade === filter)
  const tomorrow = book ? units.filter(u => statusOf(book, current, resort.id, u.key) === 'tomorrow') : []
  const flagged = book ? units.filter(u => {
    const s = statusOf(book, current, resort.id, u.key)
    return s === 'snow' || s === 'training' || s === 'closed'
  }) : []

  return (
    <main className="screen with-tabs">
      <div className="page-head">
        <span className="left"><Icon name="pin" size={11} />{resort.region} · {resort.area.split(' · ')[0]}</span>
        <span className="right"><Icon name="clock" size={11} />{current.updatedAt ? `更新 ${current.updatedAt.slice(11, 16)}` : '今日未更新'}</span>
      </div>
      <div className="page-title">雪道开放</div>
      <div className="page-sub">
        {data.name} · 官方 {TRAILS.season} 雪道图 {total} 条
        <span className="demo-pill" style={opened ? { color: '#8EE6A8', background: 'rgba(48,209,88,.12)', borderColor: 'rgba(48,209,88,.24)' } : undefined}>
          {opened ? '人工标注' : '待录入'}
        </span>
      </div>

      <div className="list-summary" style={{ borderColor: opened ? 'rgba(0,229,192,.26)' : 'rgba(255,255,255,.14)', background: opened ? 'linear-gradient(135deg,rgba(0,229,192,.16),rgba(0,229,192,.03)),rgba(255,255,255,.065)' : 'rgba(255,255,255,.06)' }}>
        <div className="top">
          <div>
            <div className="k">已开放（长期记忆）</div>
            <div className="big">{opened}<small>/ {total} 条</small></div>
          </div>
          <div className="summary-side">
            <b>今日新开 {counts.new}</b>
            明日 {counts.tomorrow}<br />
            补雪 {counts.snow} · 训练 {counts.training}<br />
            临时关闭 {counts.closed}
          </div>
        </div>
        <div className="desc">
          {opened
            ? `已开放 ${opened} 条，今天可滑 ${skiable} 条。已开放的雪道会长期记住，每天只需补新增和临时状态。`
            : '今天还没有录入。建议先点「全部开放」，再把补雪、训练、临时关闭的雪道点掉，一家 30 秒。'}
        </div>
        <div className="meta">人工标注 · 不是官方实时 API · 今日变化 <b>{marked}</b> 条</div>
        <a className="snow-cta" href={`#/trails/${resort.id}`}>{opened ? '继续录入 / 修改' : '去录入今天的雪道'} <Icon name="chevron" size={10} /></a>
      </div>

      <div className="filter-row">
        <button className={`filter${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>全部<b>{opened}/{total}</b></button>
        {sections.map(s => {
          const open = s.units.filter(u => book && statusOf(book, current, resort.id, u.key) === 'open').length
          return (
            <button key={s.grade} className={`filter${filter === s.grade ? ' on' : ''}`} onClick={() => setFilter(s.grade)}>
              <span className="fd" style={{ background: GRADE_META[s.grade].color }} />{GRADE_META[s.grade].label}<b>{open}/{s.units.length}</b>
            </button>
          )
        })}
      </div>

      {visible.map(section => {
        const color = GRADE_META[section.grade].color
        const open = section.units.filter(u => book && statusOf(book, current, resort.id, u.key) === 'open').length
        return (
          <section className="cat-section" key={section.grade}>
            <div className="cat-head">
              <div className="cat-title"><span className="dot" style={{ background: color }} />{GRADE_META[section.grade].label}<small>{GRADE_META[section.grade].sub}</small></div>
              <span className="cat-count" style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}>{open} / {section.units.length} 已开放</span>
            </div>
            <div className="trail-list">
              {section.units.map(u => {
                const st = book ? statusOf(book, current, resort.id, u.key) : undefined
                const label = u.seg ? `${u.trail.name}（${u.seg}）` : u.trail.name
                const level = levelOf(u.trail)
                const showBadge = showLevel(u.trail)
                return (
                  <div className="trail-row" key={u.key}>
                    <span className="trail-color" style={{ background: color }} />
                    <div className="trail-main">
                      <div className="trail-name">{label}{showBadge && <i className="tr-level">{level}</i>}</div>
                      <div className="trail-meta">{[trailLen(u.trail.len), u.trail.note].filter(Boolean).join(' · ') || '—'}</div>
                    </div>
                    {statusPill(st)}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {tomorrow.length > 0 && (
        <div className="future-card">
          <div className="future-head">明日预计开放 <span>共 {tomorrow.length} 条 · 明天自动顺延为“新开”</span></div>
          <div className="future-row" style={{ flexWrap: 'wrap' }}>
            {tomorrow.map(u => (
              <div className="future-day" key={u.key} style={{ flex: '0 0 auto', minWidth: 78 }}>
                <small>{GRADE_META[u.grade].label}</small>
                <b style={{ fontSize: 12 }}>{u.seg ? `${u.trail.name}（${u.seg}）` : u.trail.name}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {flagged.length > 0 && (
        <div className="future-card">
          <div className="future-head">今日提醒 <span>补雪 / 训练 / 临时关闭</span></div>
          <div className="future-row" style={{ flexWrap: 'wrap' }}>
            {flagged.map(u => {
              const s = book ? statusOf(book, current, resort.id, u.key) : undefined
              const m = s ? STATUS_META[s] : null
              return (
                <div className="future-day" key={u.key} style={{ flex: '0 0 auto', minWidth: 78 }}>
                  <small style={{ color: m?.color }}>{m?.label}</small>
                  <b style={{ fontSize: 12 }}>{u.seg ? `${u.trail.name}（${u.seg}）` : u.trail.name}</b>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="source-line">
        雪道清单来自 <b>{data.source}</b>（{TRAILS.season} 雪季，{total} 条{data.planned > data.trails.length ? `，规划 ${data.planned} 条` : ''}）；开放状态是你在 App 里手动标注的，已开放会长期保留。<br />
        {data.note}
        <a className="dev-link" href={`#/trails/${resort.id}`}>去录入</a>
        <a className="dev-link" href="#/dev">开发者</a>
      </div>
    </main>
  )
}
