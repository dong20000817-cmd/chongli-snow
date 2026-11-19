import { useEffect, useState } from 'react'
import type { ResortForecast } from '../lib/types'
import { CATEGORY_COLOR, SNOW_DATA, isToday, type CategoryId, type SnowCategory, type SnowTrail } from '../lib/status'
import { Icon } from '../components/Icons'

type Filter = 'all' | CategoryId

function statusLabel(t: SnowTrail): { label: string; cls: string } {
  const s = t.status ?? 'open'
  if (s === 'open') return { label: '开放', cls: 'open' }
  if (s === 'expected') return { label: '预计', cls: 'expected' }
  return { label: '关闭', cls: 'closed' }
}

function TrailRow({ cat, trail }: { cat: SnowCategory; trail: SnowTrail }) {
  const st = statusLabel(trail)
  return (
    <div className="trail-row">
      <span className="trail-color" style={{ background: CATEGORY_COLOR[cat.id] }} />
      <div className="trail-main">
        <div className="trail-name">{trail.name}</div>
        <div className="trail-meta">{trail.len} · {trail.note}</div>
      </div>
      <span className={`status ${st.cls}`}>{st.label}</span>
    </div>
  )
}

function CategorySection({ cat }: { cat: SnowCategory }) {
  const color = CATEGORY_COLOR[cat.id]
  return (
    <section className="cat-section">
      <div className="cat-head">
        <div className="cat-title"><span className="dot" style={{ background: color }} />{cat.name}<small>{cat.sub}</small></div>
        <span className="cat-count" style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}>{cat.open} / {cat.total} 开放</span>
      </div>
      <div className="cat-desc">{cat.desc}</div>
      <div className="trail-list">{cat.trails.map(t => <TrailRow key={t.name} cat={cat} trail={t} />)}</div>
      <div className="cat-foot">
        <span>{cat.open === 0 ? '当前无开放雪道' : '以上为开放雪道'}</span>
        <span>另有 <b>{cat.total - cat.open}</b> 条关闭 · 查看全部 <Icon name="chevron" size={9} /></span>
      </div>
    </section>
  )
}

export function SnowScreen({ resort, today }: { resort: ResortForecast; today: string }) {
  const data = SNOW_DATA.resorts[resort.id]
  const [filter, setFilter] = useState<Filter>('all')
  useEffect(() => setFilter('all'), [resort.id])
  if (!data) {
    return (
      <main className="screen with-tabs">
        <div className="page-head"><span className="left"><Icon name="pin" size={11} />{resort.region} · {resort.area.split(' · ')[0]}</span><span className="right">暂无数据</span></div>
        <div className="page-title">雪道开放</div>
        <div className="page-sub">{resort.name} · 雪道状态待更新</div>
        <div className="cat-section" style={{ marginTop: 16, padding: 16 }}>
          <div className="cat-desc" style={{ padding: 0 }}>该雪场今天还没有录入雪道开放数据。请以雪场官方公众号/公告为准。</div>
        </div>
      </main>
    )
  }
  const cats = filter === 'all' ? data.categories : data.categories.filter(c => c.id === filter)
  return (
    <main className="screen with-tabs">
      <div className="page-head">
        <span className="left"><Icon name="pin" size={11} />{resort.region} · {resort.area.split(' · ')[0]}</span>
        <span className="right"><Icon name="refresh" size={11} />更新于 {data.updatedAt}</span>
      </div>
      <div className="page-title">雪道开放</div>
      <div className="page-sub">
        {data.name} · 官方公众号 {data.sourceTime} 更新
        {SNOW_DATA.isDemo && <span className="demo-pill">示例数据</span>}
        {!isToday(SNOW_DATA.updatedAt, today) && <span className="demo-pill" style={{ color: '#FFB3AD', background: 'rgba(255,69,58,.12)', borderColor: 'rgba(255,69,58,.22)' }}>非今日数据</span>}
      </div>

      <div className="list-summary">
        <div className="top">
          <div><div className="k">今日开放</div><div className="big">{data.open}<small>/ {data.total} 条</small></div></div>
          <div className="summary-side"><b>缆车 {data.liftsOpen} / {data.liftsTotal}</b>今日新增 {data.todayNew} 条<br />预计明天 +{data.tomorrowExpected}</div>
        </div>
        <div className="desc">{data.summary}</div>
        <div className="meta">开放雪道 <b>{data.open}</b> 条 · 关闭 <b>{data.total - data.open}</b> 条 · 数据来自官方公众号</div>
      </div>

      <div className="filter-row">
        <button className={`filter${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>全部<b>{data.open}/{data.total}</b></button>
        {data.categories.map(c => (
          <button key={c.id} className={`filter${filter === c.id ? ' on' : ''}`} onClick={() => setFilter(c.id)}>
            <span className="fd" style={{ background: CATEGORY_COLOR[c.id] }} />{c.name}<b>{c.open}/{c.total}</b>
          </button>
        ))}
      </div>

      {cats.map(c => <CategorySection key={c.id} cat={c} />)}

      <div className="future-card">
        <div className="future-head">未来 3 天预计 <span>以官方当日公告为准</span></div>
        <div className="future-row">
          {data.future.map(f => (
            <div className="future-day" key={f.label}><small>{f.label}</small><b>+{f.count} 条 <span>{f.note}</span></b></div>
          ))}
        </div>
      </div>

      <div className="source-line">
        状态来自 {data.source} · {data.sourceTime} 的人工整理，非官方实时 API；预计开放时间可能因天气、造雪、赛事调整。<br />
        公众号原文、雪道长度和难度以雪场发布为准。
        <a className="dev-link" href="#/dev">开发者</a>
      </div>
    </main>
  )
}
