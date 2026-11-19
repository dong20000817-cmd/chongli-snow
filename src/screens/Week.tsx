import type { ResortForecast, Snapshot } from '../lib/types'
import { TIERS, dailyFor, dailyScore, findBestDay, shortReason } from '../lib/recommend'
import { datesOf, dayLabel } from '../lib/time'
import { fmtDate } from '../lib/format'
import { OfflineBanner, SourceNote, WeekRow } from '../components/Common'
import { Icon } from '../components/Icons'

export function Week({ resort, snapshot, onBack, onOpenWhy, offline, stale, error }: {
  resort: ResortForecast
  snapshot: Snapshot
  onBack: () => void
  onOpenWhy: (dayIndex: number) => void
  offline: boolean
  stale: boolean
  error: string | null
}) {
  const dates = datesOf(resort.hourly)
  const days = dates.map(date => dailyFor(resort, date))
  const best = findBestDay(days)
  const bestMeta = TIERS[best.day.tier]
  return (
    <main className="screen week with-tabs">
      <div className="nav">
        <button className="nav-back" onClick={onBack} aria-label="返回"><Icon name="back" size={16} /></button>
        <div className="nav-title">未来 7 天</div>
        <div className="nav-space" />
      </div>
      {(offline || stale) && <OfflineBanner snapshot={snapshot} error={error} stale={stale} />}
      <div className="wind-title">{resort.short} · 每日建议</div>
      <div className="wind-sub">仅日间 08:00–17:00 · 点击任意一天看依据</div>

      <div className="week-list" style={{ marginTop: 10 }}>
        {days.map((d, i) => (
          <WeekRow key={d.date} daily={d} idx={i} onOpen={() => onOpenWhy(i)} />
        ))}
      </div>

      <button className="week-best" onClick={() => onOpenWhy(best.index)}>
        <div className="wb-ico"><Icon name="ski" size={17} /></div>
        <div className="wb-main">
          <div className="wb-kicker">本周最佳</div>
          <b>{dayLabel(best.day.date, best.index)} {fmtDate(best.day.date)} · {bestMeta.label}</b>
          <p>{shortReason(best.day.tier, best.day)}</p>
        </div>
        <div className="wb-arrow">›</div>
      </button>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, color: 'var(--ink4)', marginBottom: 4 }}>本周建议分布 · 安全分</div>
        <div className="week-dist">
          {days.map((d, i) => (
            <div key={d.date} className="wd-item">
              <span style={{ background: TIERS[d.tier].color }} />
              <small>{dayLabel(d.date, i)}</small>
              <b>{dailyScore(d)}</b>
            </div>
          ))}
        </div>
      </div>

      <SourceNote snapshot={snapshot} />
    </main>
  )
}
