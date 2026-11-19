import { useMemo, useState } from 'react'
import type { ResortForecast, Snapshot } from '../lib/types'
import { currentHour, currentIndex, hourOf } from '../lib/time'
import { dirText, riskOf, windLevel, windName } from '../lib/wind'
import { fmtTime, round } from '../lib/format'
import { WindChart } from '../components/WindChart'
import { OfflineBanner, SourceNote } from '../components/Common'
import { Icon } from '../components/Icons'

export function WindDetail({ resort, snapshot, onBack, offline, stale, error }: { resort: ResortForecast; snapshot: Snapshot; onBack: () => void; offline: boolean; stale: boolean; error: string | null }) {
  const [span, setSpan] = useState(48)
  const ci = currentIndex(resort, snapshot)
  const current = currentHour(resort, snapshot)
  const p = current.peak
  const wl = windLevel(p.wind)
  const gl = windLevel(p.gust)
  const risk = riskOf(current)
  const next = resort.hourly.slice(ci, ci + 12)
  const nowH = Number(snapshot.generatedAt.slice(11, 13))
  const afterNow = next.filter(h => hourOf(h.time) > nowH)
  const table = resort.hourly.slice(ci, ci + 6)

  const segments = useMemo(() => {
    const merged: Array<{ key: 'ok' | 'slow' | 'stop'; count: number }> = []
    next.forEach(h => {
      const key = riskOf(h).key
      const last = merged[merged.length - 1]
      if (last && last.key === key) last.count += 1
      else merged.push({ key, count: 1 })
    })
    return merged
  }, [next])

  const events = useMemo(() => {
    const list: Array<{ time: string; label: string }> = []
    let prev = riskOf(next[0] ?? current).key
    afterNow.forEach(h => {
      const key = riskOf(h).key
      if (key !== prev) {
        list.push({ time: h.time, label: key === 'stop' ? '停运' : key === 'slow' ? '降速' : '恢复' })
        prev = key
      }
    })
    return list.slice(0, 2)
  }, [afterNow, next, current])

  return (
    <main className="screen wind with-tabs">
      <div className="nav">
        <button className="nav-back" onClick={onBack} aria-label="返回"><Icon name="back" size={16} /></button>
        <div className="nav-title">风力详情</div>
        <div className="nav-space" />
      </div>
      {(offline || stale) && <OfflineBanner snapshot={snapshot} error={error} stale={stale} />}
      <div className="wind-title">{resort.short} · 山顶风力</div>
      <div className="wind-sub">{resort.name} · 海拔 {resort.peakElev}m · 更新于 {snapshot.generatedAt.slice(11, 16)}</div>

      <div className="wind-hero">
        <div className="wl">{wl}<small>级</small></div>
        <div className="wind-hero-right">
          <b>{round(p.wind)} km/h {dirText(p.dir)}</b><br />
          阵风 {round(p.gust)} km/h · {gl}级
          <div className="risk-pill" style={{ color: risk.color, background: `${risk.color}24`, border: `1px solid ${risk.color}47` }}>{risk.label}</div>
        </div>
      </div>

      <div className="segmented">
        {[24, 48, 72].map(n => (
          <button key={n} className={span === n ? 'on' : ''} onClick={() => setSpan(n)}>{n}小时</button>
        ))}
      </div>

      <div className="card chart-card">
        <div className="card-head">
          <div>
            <div className="card-title">未来 {span} 小时风力</div>
            <div className="card-sub">柱=持续风 · 虚线=阵风 · 箭头=风向</div>
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)' }}>单位 km/h</div>
        </div>
        <WindChart hourly={resort.hourly} startIndex={ci} count={span} currentIndex={ci} labelsEvery={span > 30 ? 6 : 3} />
        <div className="legend">
          <span><i style={{ background: '#FF9F0A' }} />持续风</span>
          <span><i className="dash" />阵风</span>
          <span><i className="band" />6–8级风险</span>
        </div>
      </div>

      <div className="risk-card">
        <div className="risk-head">
          <div className="risk-title">缆车风险时间线</div>
          <div className="risk-state" style={{ color: risk.key === 'stop' ? '#FFB3AD' : '#FFD8A8' }}>现在{risk.label}</div>
        </div>
        <div className="risk-track">
          {segments.map((seg, i) => (
            <i key={`${seg.key}-${i}`} style={{
              width: `${(seg.count / Math.max(1, next.length)) * 100}%`,
              background: seg.key === 'stop' ? '#FF453A' : seg.key === 'slow' ? '#FF9F0A' : '#30D158',
            }} />
          ))}
        </div>
        <div className="risk-times">
          <span>现在</span>
          <span>{events[0] ? `${fmtTime(events[0].time)} ${events[0].label}` : '未来12小时正常'}</span>
          <span>{events[1] ? `${fmtTime(events[1].time)} ${events[1].label}` : '—'}</span>
        </div>
        <div className="risk-note">
          按持续风 ≥39 / 阵风 ≥60 估算降速，持续风 ≥50 / 阵风 ≥75 估算停运。
          {events[0] ? ` 今天 ${fmtTime(events[0].time)} 起${events[0].label}。` : ''} 非雪场官方公告。
        </div>
      </div>

      <div className="hour-table">
        <div className="ht-head"><span>时间</span><span>持续风</span><span>阵风</span><span>风级</span></div>
        {table.map(h => {
          const level = windLevel(h.peak.wind)
          return (
            <div className="ht-row" key={h.time}>
              <b>{fmtTime(h.time)}</b>
              <span>{round(h.peak.wind)} km/h</span>
              <span>{round(h.peak.gust)} km/h</span>
              <span className="lvl" style={{ color: level >= 8 ? '#FF453A' : level >= 6 ? '#FF9F0A' : '#FFD60A' }}>{level}级</span>
            </div>
          )
        })}
      </div>

      <a className="windy-link" href={`https://www.windy.com/${resort.lat}/${resort.lon}?wind,${resort.lat},${resort.lon},10`} target="_blank" rel="noopener">
        在 Windy 查看风场动画 <Icon name="external" size={12} />
      </a>
      <div className="wind-footer">
        <div>当前风级 {wl}级 · {windName(wl)} · {dirText(p.dir)}</div>
        <SourceNote snapshot={snapshot} />
      </div>
    </main>
  )
}
