import { forwardRef } from 'react'
import type { DigestData } from '../lib/digest'
import { weatherMeta } from '../lib/digest'
import { TIERS } from '../lib/recommend'
import { SNOW_DATA, ROAD_DATA, roadStateColor } from '../lib/status'
import { rgba } from '../lib/format'

function Head({ date }: { date: string }) {
  return (
    <div className="dc-head">
      <div className="dc-brand">滑雪天气通 · 每日情报</div>
      <div className="dc-date">{date}</div>
    </div>
  )
}

function Foot({ left, right }: { left: string; right: string }) {
  return <div className="dc-foot"><span>{left}</span><span>{right}</span></div>
}

export const WeatherDigestCard = forwardRef<HTMLDivElement, { digest: DigestData }>(function WeatherDigestCard({ digest }, ref) {
  const rows = digest.weather.slice(0, 8)
  const top = rows[0]
  const bottom = rows[rows.length - 1]
  return (
    <div ref={ref} className="digest-card weather">
      <Head date={digest.dateLabel} />
      <div className="dc-card-title">{digest.isTomorrow ? '明日' : '今日'}滑雪指数</div>
      <div className="dc-card-sub">8 家雪场 · 按日间 08:00–17:00 建议排序</div>
      <div className="dc-rule" />
      <div className="dc-weather-list">
        {rows.map((r, i) => {
          const meta = TIERS[r.daily.tier]
          return (
            <div className="dc-weather-row" key={r.resort.id}>
              <div className="dc-rank">{String(i + 1).padStart(2, '0')}</div>
              <div className="dc-resort"><b>{r.resort.short}</b><small>{weatherMeta(r)}</small></div>
              <div className="dc-tier" style={{ color: meta.color, background: rgba(meta.color, 0.14), border: `1px solid ${rgba(meta.color, 0.24)}` }}>{meta.label}</div>
              <div className="dc-score">{r.score}<small>/100</small></div>
            </div>
          )
        })}
      </div>
      <Foot left={top && bottom ? `最推荐 ${top.resort.short} · 最不建议 ${bottom.resort.short}` : '今日雪场建议'} right="天气：Open-Meteo" />
    </div>
  )
})

export const SnowDigestCard = forwardRef<HTMLDivElement, { digest: DigestData }>(function SnowDigestCard({ digest }, ref) {
  const opened = digest.snow.filter(x => x.type === 'open').slice(0, 3)
  const expected = digest.snow.filter(x => x.type === 'expected').slice(0, 2)
  const closed = digest.snow.filter(x => x.type === 'closed').slice(0, 1)
  const highlights = [...opened, ...expected, ...closed]
  const top = ['wanlong', 'genting', 'thaiwoo'].map(id => ({ id, d: SNOW_DATA.resorts[id] })).filter(x => x.d)
  return (
    <div ref={ref} className="digest-card snow">
      <Head date={digest.dateLabel} />
      <div className="dc-card-title">{digest.isTomorrow ? '明日' : '今日'}雪道速报</div>
      <div className="dc-card-sub">新增开放 · 临时关闭 · 预计开放</div>
      <div className="dc-summary-strip">
        {top.map(({ id, d }) => (
          <div className="dc-summary-cell" key={id}>
            <small>{d.short}</small>
            <b>{d.open}<span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', fontWeight: 400 }}> / {d.total}</span></b>
          </div>
        ))}
      </div>
      <div className="dc-change-list">
        {highlights.map((h, i) => {
          const color = h.type === 'open' ? '#30D158' : h.type === 'expected' ? '#0A84FF' : '#FF9F0A'
          const kind = h.type === 'open' ? '新开' : h.type === 'expected' ? '预计' : '关闭'
          return (
            <div className="dc-change" key={`${h.resort}-${i}`}>
              <div className="dc-ico" style={{ color, background: rgba(color, 0.16), border: `1px solid ${rgba(color, 0.25)}` }}>{h.type === 'open' ? '↗' : h.type === 'expected' ? '◷' : '!'}</div>
              <div className="dc-change-main"><b>{h.resort}</b><small>{h.text}</small></div>
              <span className="dc-kind" style={{ color, background: rgba(color, 0.14) }}>{kind}</span>
            </div>
          )
        })}
      </div>
      <Foot left={`${SNOW_DATA.isDemo ? '演示数据 · ' : ''}官方公众号人工整理`} right={`数据 ${SNOW_DATA.updatedAt.slice(5, 10).replace('-', '/')} ${SNOW_DATA.updatedAt.slice(11, 16)}`} />
    </div>
  )
})

export const RoadDigestCard = forwardRef<HTMLDivElement, { digest: DigestData }>(function RoadDigestCard({ digest }, ref) {
  const road = ROAD_DATA
  const route = road.routes.find(r => r.closure) ?? road.routes[0]
  const closure = route.closure
  return (
    <div ref={ref} className="digest-card road">
      <Head date={digest.dateLabel} />
      <div className="dc-card-title">{digest.isTomorrow ? '明日' : '今日'}进京 / 出京路况</div>
      <div className="dc-card-sub">北京 → 崇礼 · 三条主要路线</div>
      <div className="dc-road-overall" style={{ borderColor: 'rgba(255,159,10,.38)' }}>
        <b>{road.overall.label}</b>
        <small>{road.overall.desc}</small>
      </div>
      <div style={{ marginTop: 4 }}>
        {road.routes.map(r => {
          const color = roadStateColor(r.stateKey)
          return (
            <div className="dc-road-route" key={r.id}>
              <div className="dc-route-name"><b>{r.name}</b><small>{r.meta} · {r.duration}</small></div>
              <span className="dc-route-state" style={{ color, background: rgba(color, 0.14), border: `1px solid ${rgba(color, 0.22)}` }}>{r.state}</span>
            </div>
          )
        })}
      </div>
      {closure && (
        <div className="dc-road-closure">
          <b>{closure.road} {closure.segment}</b>
          <small>{closure.reason} · {closure.eta} · 绕行 {closure.detour}</small>
        </div>
      )}
      <div className="dc-road-vis">
        {route.visibility.slice(0, 3).map(v => (
          <div key={v.name}><small>{v.name}</small><b>{v.vis}</b></div>
        ))}
      </div>
      <div className="dc-road-advice">出发建议：{closure ? '避开封闭段，优先考虑京藏 + 张承，或等预计恢复后再走。' : '路线可通行，注意山区能见度和暗冰。'}</div>
      <Foot left={`${road.isDemo ? '演示数据 · ' : ''}${road.source.split(' / ')[0]}`} right={`更新 ${road.updatedAt.slice(11, 16)}`} />
    </div>
  )
})
