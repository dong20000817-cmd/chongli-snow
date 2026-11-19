import type { ResortForecast, Snapshot } from '../lib/types'
import { TIERS, dailyFor } from '../lib/recommend'
import { currentHour, currentIndex, datesOf, effectiveDayIndex } from '../lib/time'
import { temp, tempShort, weatherText } from '../lib/format'
import { dirText, riskOf, windLevel } from '../lib/wind'
import { WindChart } from '../components/WindChart'
import {
  HourlyStrip,
  MetricGrid,
  OfflineBanner,
  SourceNote,
  Topline,
  VerdictCard,
  WeekRow,
} from '../components/Common'
import { Icon, WeatherIcon } from '../components/Icons'

interface HomeProps {
  resort: ResortForecast
  snapshot: Snapshot
  refreshing: boolean
  offline: boolean
  stale: boolean
  error: string | null
  onRefresh: () => void
  onOpenWhy: (dayIndex?: number) => void
  onOpenWind: () => void
  onOpenWeek: () => void
}

export function Home({
  resort,
  snapshot,
  refreshing,
  offline,
  stale,
  error,
  onRefresh,
  onOpenWhy,
  onOpenWind,
  onOpenWeek,
}: HomeProps) {
  const dates = datesOf(resort.hourly)
  const verdictIndex = Math.min(effectiveDayIndex(snapshot), Math.max(0, dates.length - 1))
  const daily = dailyFor(resort, dates[verdictIndex])
  const current = currentHour(resort, snapshot)
  const ci = currentIndex(resort, snapshot)
  const p = current.peak
  const b = current.base
  const windNow = windLevel(p.wind)
  const gustNow = windLevel(p.gust)
  const risk = riskOf(daily.worst)
  const today = dates[0]
  const chartStartRaw = resort.hourly.findIndex(h => h.time === `${today}T06:00`)
  const chartStart = chartStartRaw >= 0 ? chartStartRaw : 0
  const dayName = verdictIndex === 0 ? '今天' : '明天'
  const t = TIERS[daily.tier]
  const snow24 = resort.hourly.slice(ci, ci + 24).reduce((sum, h) => sum + (Number(h.peak.snow) || 0), 0)

  return (
    <main className="screen home with-tabs">
      <Topline resort={resort} snapshot={snapshot} refreshing={refreshing} onRefresh={onRefresh} />
      {(offline || stale) && <OfflineBanner snapshot={snapshot} error={error} stale={stale} />}
      <h1 className="resort-title">{resort.name}</h1>
      <div className="resort-sub">
        山顶 {resort.peakElev}m · 山底 {resort.baseElev}m
      </div>

      <div className="hero">
        <div className="hero-temp">{temp(b.temp)}<span className="deg">°</span></div>
        <div className="hero-right">
          <WeatherIcon code={b.code} isDay={b.isDay} size={66} className="hero-icon" />
          <div className="condition">{weatherText(b.code)}</div>
          <div className="hero-range">日间 {tempShort(daily.high)} / {tempShort(daily.low)}</div>
          <div className="feels">体感 <b>{tempShort(p.feels)}</b> · 山顶</div>
        </div>
      </div>

      <VerdictCard daily={daily} current={current} dayName={dayName} onOpen={() => onOpenWhy(verdictIndex)} />

      <MetricGrid resort={resort} current={current} snapshot={snapshot} />

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">风力 · 未来24小时</div>
            <div className="card-sub">山顶 10m 风速 · 虚线为阵风</div>
          </div>
          <div className="wind-alert" style={{ color: risk.key === 'stop' ? '#FFB3AD' : '#FFD8A8', background: `${risk.color}24`, borderColor: `${risk.color}47` }}>
            今日{risk.label}
          </div>
        </div>
        <div className="wind-now">
          <div className="wind-big">{windNow}<small>级</small></div>
          <div className="wind-meta">
            <b>{Math.round(p.wind)} km/h</b> {dirText(p.dir)}<br />
            阵风 {Math.round(p.gust)} km/h · {gustNow}级
          </div>
          <button className="card-link" onClick={onOpenWind} style={{ marginLeft: 'auto' }}>
            详情 <Icon name="chevron" size={12} />
          </button>
        </div>
        <WindChart hourly={resort.hourly} startIndex={chartStart} count={24} currentIndex={ci} />
        <div className="legend">
          <span><i style={{ background: '#FF9F0A' }} />持续风</span>
          <span><i className="dash" />阵风</span>
          <span><i className="band" />缆车风险区</span>
        </div>
      </div>

      <div className="section-title"><h2>逐小时</h2><span style={{ fontSize: 9.5, color: 'var(--ink3)' }}>山顶风级</span></div>
      <HourlyStrip resort={resort} snapshot={snapshot} n={12} />

      <div className="section-title"><h2>未来 7 天</h2><button className="section-link" onClick={onOpenWeek}>查看全部 <Icon name="chevron" size={11} /></button></div>
      <div className="week-list">
        {dates.slice(0, 3).map((date, idx) => (
          <WeekRow key={date} daily={dailyFor(resort, date)} idx={idx} compact onOpen={() => onOpenWhy(idx)} />
        ))}
      </div>

      <div className="source-line">
        未来24h降雪 {snow24 ? snow24.toFixed(1) : '0'} cm · 今日建议 <span style={{ color: t.color }}>{t.label}</span>
      </div>
      <SourceNote snapshot={snapshot} />
    </main>
  )
}
