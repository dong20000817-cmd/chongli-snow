import { useEffect, useState } from 'react'
import type { ResortForecast } from '../lib/types'
import { Icon } from '../components/Icons'
import {
  GRADE_META,
  STATUS_META,
  STATUS_ORDER,
  TRAILS,
  blankCounts,
  isSkiable,
  loadBook,
  trailByGrade,
  trailLen,
  type Grade,
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
  const [day, setDay] = useState<TrailDay | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    setDay(loadBook(today).day)
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

  const marks = day?.marks[resort.id] ?? {}
  const sections = trailByGrade(resort.id)
  const counts = blankCounts()
  for (const s of Object.values(marks)) counts[s] += 1
  const marked = Object.keys(marks).length
  const skiable = STATUS_ORDER.filter(s => isSkiable(s)).reduce((n, s) => n + counts[s], 0)
  const total = data.trails.length
  const visible = filter === 'all' ? sections : sections.filter(s => s.grade === filter)
  const tomorrow = data.trails.filter(t => marks[t.name] === 'tomorrow')
  const flagged = data.trails.filter(t => ['snow', 'training', 'closed'].includes(marks[t.name] ?? ''))

  return (
    <main className="screen with-tabs">
      <div className="page-head">
        <span className="left"><Icon name="pin" size={11} />{resort.region} · {resort.area.split(' · ')[0]}</span>
        <span className="right"><Icon name="clock" size={11} />{day?.updatedAt ? `录入 ${day.updatedAt.slice(11, 16)}` : '今日未录入'}</span>
      </div>
      <div className="page-title">雪道开放</div>
      <div className="page-sub">
        {data.name} · {TRAILS.season} 雪道图 {total} 条
        <span className="demo-pill" style={marked ? { color: '#8EE6A8', background: 'rgba(48,209,88,.12)', borderColor: 'rgba(48,209,88,.24)' } : undefined}>
          {marked ? '人工录入' : '待录入'}
        </span>
      </div>

      <div className="list-summary" style={{ borderColor: marked ? 'rgba(0,229,192,.26)' : 'rgba(255,255,255,.14)', background: marked ? 'linear-gradient(135deg,rgba(0,229,192,.16),rgba(0,229,192,.03)),rgba(255,255,255,.065)' : 'rgba(255,255,255,.06)' }}>
        <div className="top">
          <div>
            <div className="k">{marked ? '今日可滑（含补雪/训练）' : '今日尚未录入'}</div>
            <div className="big">{marked ? skiable : '—'}<small>/ {total} 条</small></div>
          </div>
          <div className="summary-side">
            <b>新开 {counts.new}</b>
            明日 {counts.tomorrow}<br />
            补雪 {counts.snow} · 训练 {counts.training}<br />
            临时关闭 {counts.closed}
          </div>
        </div>
        <div className="desc">
          {marked
            ? `已标注 ${marked} / ${total} 条。${counts.closed ? `临时关闭 ${counts.closed} 条，` : ''}${counts.snow ? `补雪 ${counts.snow} 条，` : ''}雪况与开放时间以雪场当日公告为准。`
            : '今天还没有录入。建议先点「全部开放」，再把补雪、训练、临时关闭的雪道点掉，一家 30 秒。'}
        </div>
        <div className="meta">人工标注 · 不是官方实时 API · 共 <b>{total}</b> 条雪道</div>
        <a className="snow-cta" href={`#/trails/${resort.id}`}>{marked ? '继续录入 / 修改' : '去录入今天的雪道'} <Icon name="chevron" size={10} /></a>
      </div>

      <div className="filter-row">
        <button className={`filter${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>全部<b>{skiable}/{total}</b></button>
        {sections.map(s => {
          const open = s.trails.filter(t => marks[t.name] && isSkiable(marks[t.name]!)).length
          return (
            <button key={s.grade} className={`filter${filter === s.grade ? ' on' : ''}`} onClick={() => setFilter(s.grade)}>
              <span className="fd" style={{ background: GRADE_META[s.grade].color }} />{GRADE_META[s.grade].label}<b>{open}/{s.trails.length}</b>
            </button>
          )
        })}
      </div>

      {visible.map(section => {
        const color = GRADE_META[section.grade].color
        const open = section.trails.filter(t => marks[t.name] && isSkiable(marks[t.name]!)).length
        return (
          <section className="cat-section" key={section.grade}>
            <div className="cat-head">
              <div className="cat-title"><span className="dot" style={{ background: color }} />{GRADE_META[section.grade].label}<small>{GRADE_META[section.grade].sub}</small></div>
              <span className="cat-count" style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}>{open} / {section.trails.length} 可滑</span>
            </div>
            <div className="trail-list">
              {section.trails.map(t => {
                const st = marks[t.name]
                return (
                  <div className="trail-row" key={t.name}>
                    <span className="trail-color" style={{ background: color }} />
                    <div className="trail-main">
                      <div className="trail-name">{t.name}</div>
                      <div className="trail-meta">{[trailLen(t.len), t.note].filter(Boolean).join(' · ') || '—'}</div>
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
            {tomorrow.map(t => (
              <div className="future-day" key={t.name} style={{ flex: '0 0 auto', minWidth: 78 }}>
                <small>{GRADE_META[t.grade].label}</small>
                <b style={{ fontSize: 12 }}>{t.name}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {flagged.length > 0 && (
        <div className="future-card">
          <div className="future-head">今日提醒 <span>补雪 / 训练 / 临时关闭</span></div>
          <div className="future-row" style={{ flexWrap: 'wrap' }}>
            {flagged.map(t => {
              const m = STATUS_META[marks[t.name]!]
              return (
                <div className="future-day" key={t.name} style={{ flex: '0 0 auto', minWidth: 78 }}>
                  <small style={{ color: m.color }}>{m.label}</small>
                  <b style={{ fontSize: 12 }}>{t.name}</b>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="source-line">
        雪道清单来自 <b>{data.source}</b>（{TRAILS.season} 雪季，{total} 条{data.planned > total ? `，规划 ${data.planned} 条` : ''}）；开放状态是你在 App 里手动标注的，不是官方实时接口。<br />
        {data.note}
        <a className="dev-link" href={`#/trails/${resort.id}`}>去录入</a>
        <a className="dev-link" href="#/dev">开发者</a>
      </div>
    </main>
  )
}
