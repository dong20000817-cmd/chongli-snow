import { useEffect, type ReactNode } from 'react'
import type { DailySummary, HourPoint, ResortForecast, Snapshot } from '../lib/types'
import { TIERS, reasonFor } from '../lib/recommend'
import { fmtTime, fmtVis, rgba, temp, tempShort, weatherText } from '../lib/format'
import { dirText, levelColor, riskOf, windLevel, windName } from '../lib/wind'
import { currentIndex, dayLabel, datesOf } from '../lib/time'
import { Icon, WeatherIcon } from './Icons'

export function Topline({ resort, snapshot, refreshing, onRefresh }: {
  resort: ResortForecast
  snapshot: Snapshot
  refreshing: boolean
  onRefresh: () => void
}) {
  return (
    <div className="topline">
      <span className="region"><Icon name="pin" size={11} />{resort.region} · {resort.area.split(' · ')[0]}</span>
      <button className={`refresh-btn ${refreshing ? 'loading' : ''}`} onClick={onRefresh} aria-label="刷新天气">
        <Icon name="refresh" size={12} />
        <span>{refreshing ? '更新中' : `更新于 ${snapshot.generatedAt.slice(11, 16)}`}</span>
      </button>
    </div>
  )
}

export function VerdictCard({ daily, current, dayName, onOpen }: {
  daily: DailySummary
  current: HourPoint
  dayName: string
  onOpen: () => void
}) {
  const meta = TIERS[daily.tier]
  const col = meta.color
  const curLevel = windLevel(current.peak.wind)
  const gustLevel = windLevel(current.peak.gust)
  return (
    <div
      className={`verdict tier-${daily.tier}`}
      style={{
        background: `linear-gradient(135deg,${rgba(col, 0.4)},${rgba(col, 0.1)}),rgba(15,23,34,.72)`,
        borderColor: rgba(col, 0.44),
        color: col,
      }}
    >
      <div className="verdict-top">
        <div className="verdict-glyph"><Icon name={meta.icon} size={20} /></div>
        <div>
          <div className="verdict-label">{meta.label}</div>
          <div className="verdict-window">{dayName} 08:00–17:00 · 最差 {fmtTime(daily.worst.time)}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 9.5, color: 'rgba(255,255,255,.62)', lineHeight: 1.5 }}>
          现在<br /><b style={{ color: '#fff', fontSize: 12 }}>{curLevel}级 · 阵风{gustLevel}级</b>
        </div>
      </div>
      <div className="verdict-reason">{reasonFor(daily.tier, daily.worst)}</div>
      <div className="verdict-foot">
        <span>{daily.tier === 'hell' ? '安全优先，建议改期或改雪场' : daily.tier === 'poor' ? '如要上山，避开最差时段' : daily.tier === 'okay' ? '可滑，注意防风保暖' : '今天适合上山'}</span>
        <button className="verdict-link" onClick={onOpen}>查看依据 <Icon name="chevron" size={11} /></button>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, icon }: { label: string; value: ReactNode; sub: string; icon: Parameters<typeof Icon>[0]['name'] }) {
  return (
    <div className="metric">
      <div className="metric-label"><Icon name={icon} size={12} />{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  )
}

export function MetricGrid({ resort, current, snapshot }: {
  resort: ResortForecast
  current: HourPoint
  snapshot: Snapshot
}) {
  const b = current.base
  const p = current.peak
  const ci = currentIndex(resort, snapshot)
  const snow24 = resort.hourly.slice(ci, ci + 24).reduce((sum, h) => sum + (Number(h.peak.snow) || 0), 0)
  const wl = windLevel(p.wind)
  const gl = windLevel(p.gust)
  return (
    <div className="metrics">
      <Metric label="雪场天气" value={<span style={{ fontSize: 19 }}>{weatherText(b.code)}</span>} sub={`未来24h降雪 ${snow24 ? snow24.toFixed(1) : '0'} cm`} icon="cloud" />
      <Metric label="能见度" value={fmtVis(p.vis)} sub={`山顶 · ${p.vis != null && p.vis >= 10000 ? '通透' : p.vis != null && p.vis < 2000 ? '偏低' : '尚可'}`} icon="eye" />
      <Metric label="山顶温度" value={tempShort(p.temp)} sub={`${resort.peakElev}m`} icon="thermo" />
      <Metric label="山底温度" value={tempShort(b.temp)} sub={`${resort.baseElev}m`} icon="thermo" />
      <Metric label="体感温度" value={tempShort(p.feels)} sub="山顶风冷" icon="thermo" />
      <Metric label="风向" value={dirText(p.dir)} sub={`${Math.round(p.dir)}° · 山顶`} icon="compass" />
      <Metric label="风速" value={<>{Math.round(p.wind)}<small> km/h</small></>} sub={`阵风 ${Math.round(p.gust)} km/h`} icon="wind" />
      <Metric label="风级" value={<>{wl}<small>级</small></>} sub={`阵风 ${gl}级 · ${windName(wl)}`} icon="gauge" />
    </div>
  )
}

export function HourlyStrip({ resort, snapshot, n = 12 }: { resort: ResortForecast; snapshot: Snapshot; n?: number }) {
  const ci = currentIndex(resort, snapshot)
  const hours = resort.hourly.slice(ci, ci + n)
  return (
    <div className="hourly-wrap">
      <div className="hourly">
        {hours.map((h, i) => {
          const level = windLevel(h.peak.wind)
          const col = levelColor(level)
          return (
            <div className="hour" key={h.time}>
              <div className="ht">{i === 0 ? '现在' : fmtTime(h.time)}</div>
              <WeatherIcon code={h.base.code} isDay={h.base.isDay} size={21} />
              <div className="htemp">{tempShort(h.base.temp)}</div>
              <div className="hwind" style={{ color: col, background: rgba(col, 0.13) }}>{level}级</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WeekRow({ daily, idx, compact, onOpen }: {
  daily: DailySummary
  idx: number
  compact?: boolean
  onOpen: () => void
}) {
  const meta = TIERS[daily.tier]
  return (
    <button className="week-row" onClick={onOpen}>
      <span className="week-day">{dayLabel(daily.date, idx)}<small>{daily.date.slice(5).replace('-', '/')}</small></span>
      <WeatherIcon code={daily.worst.base.code} isDay={daily.worst.base.isDay} size={23} className="week-ico" />
      <span className="week-main">
        <span className="pill" style={{ color: meta.color, background: rgba(meta.color, 0.15), border: `1px solid ${rgba(meta.color, 0.26)}` }}>{meta.label}</span>
        <span className="week-reason">{shortReasonSafe(daily)}</span>
      </span>
      <span className="week-temp">{tempShort(daily.high)}<small>{tempShort(daily.low)}</small></span>
      {!compact && <Icon name="chevron" size={13} className="week-chev" />}
    </button>
  )
}

function shortReasonSafe(daily: DailySummary): string {
  const w = daily.worst.peak
  if (daily.tier === 'hell') {
    if (w.gust >= 75) return `阵风 ${windLevel(w.gust)} 级，缆车可能停运`
    if (w.vis != null && w.vis < 500) return `能见度 ${fmtVis(w.vis)}`
    if (w.feels != null && w.feels <= -30) return `体感 ${Math.round(w.feels)}°`
    return '风力达到危险级别'
  }
  if (daily.tier === 'poor') {
    if (w.gust >= 60) return `阵风 ${windLevel(w.gust)} 级，缆车可能降速`
    if (w.vis != null && w.vis < 2000) return `能见度 ${fmtVis(w.vis)}`
    return `体感 ${Math.round(w.feels)}°，注意保暖`
  }
  if (daily.tier === 'okay') {
    if (w.vis != null && w.vis < 2000) return `短时能见度 ${fmtVis(w.vis)}，其余时段可滑`
    if (w.wind >= 29) return `山顶风 ${windLevel(w.wind)} 级，缆车预计正常`
    if (w.feels != null && w.feels <= -26) return `短时体感 ${Math.round(w.feels)}°，其余时段可滑`
    return `能见度 ${fmtVis(w.vis)}，整体可滑`
  }
  const b = daily.best.peak
  return `能见度 ${fmtVis(b.vis)}，风 ${windLevel(b.wind)} 级`
}

export function SourceNote({ snapshot }: { snapshot?: Snapshot }) {
  return (
    <div className="source-line">
      滑雪天气通 · 数据：Open-Meteo（CC BY 4.0）· 预报非实况<br />
      缆车风险为天气估算，以雪场公告为准{snapshot?.generatedAt ? ` · 更新于 ${snapshot.generatedAt.slice(11, 16)}` : ''}。
    </div>
  )
}

export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" aria-label="切换雪场" onClick={onClick}>
      <i /><i /><i />
    </button>
  )
}

export function OfflineBanner({ snapshot, error, stale = false }: { snapshot: Snapshot; error: string | null; stale?: boolean }) {
  const time = snapshot.generatedAt.slice(11, 16)
  return (
    <div className="offline-banner">
      <Icon name="warning" size={13} />
      <span>{stale ? '数据可能已过期' : '离线'} · 显示 {time} 的数据{error ? `（${error}）` : ''}</span>
    </div>
  )
}

export function LoadingScreen({ refreshing = false }: { refreshing?: boolean }) {
  return (
    <div className="app">
      <div className="bg bg-night" />
      <div className="loading-screen">
        <div className="loading-mark"><Icon name="snowflake" size={36} /></div>
        <h1>滑雪天气通</h1>
        <p>{refreshing ? '正在获取最新雪场天气…' : '正在获取崇礼 / 金山岭雪场天气…'}</p>
        <div className="loading-dots"><i /><i /><i /></div>
      </div>
    </div>
  )
}

export function ErrorScreen({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="app">
      <div className="bg bg-night" />
      <div className="error-screen">
        <div className="loading-mark" style={{ color: '#FFB3AD' }}><Icon name="warning" size={34} /></div>
        <h1>无法连接天气服务</h1>
        <p>{message || '请检查网络后重试。'}<br />如果之前打开过，会优先显示缓存数据。</p>
        <div className="error-actions">
          <button onClick={onRetry}>重新加载</button>
        </div>
      </div>
    </div>
  )
}

export function BottomSheet({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </>
  )
}

export function SheetHandle() {
  return <div className="handle" />
}

export function SheetClose({ onClose }: { onClose: () => void }) {
  return <button className="sheet-close" onClick={onClose} aria-label="关闭"><Icon name="close" size={13} /></button>
}

export function backgroundClass(hour: HourPoint): string {
  if (!hour.peak.isDay) return 'bg-night'
  const c = Number(hour.peak.code) || 0
  if ([71, 73, 75, 77, 85, 86].includes(c)) return 'bg-snow'
  if ([45, 48].includes(c)) return 'bg-fog'
  if (c <= 1) return 'bg-clear'
  return 'bg-cloud'
}

export function dateSequence(resort: ResortForecast): string[] {
  return datesOf(resort.hourly)
}

export function levelText(level: number): string {
  return `${level}级`
}

export function riskText(hour: HourPoint): string {
  return riskOf(hour).label
}

export { TIERS, temp, fmtTime }
