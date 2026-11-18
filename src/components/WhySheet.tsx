import type { ResortForecast, Snapshot } from '../lib/types'
import { TIERS, betterWindow, dailyFor, factorsFor, overallScore, reasonFor } from '../lib/recommend'
import { nowMinutes } from '../lib/time'
import { fmtTime, rgba } from '../lib/format'
import { BottomSheet, SheetClose, SheetHandle } from './Common'
import { Icon } from './Icons'

export function WhySheet({ resort, snapshot, dayIndex, onClose, onOpenWind }: {
  resort: ResortForecast
  snapshot: Snapshot
  dayIndex: number
  onClose: () => void
  onOpenWind: () => void
}) {
  const dates = Array.from(new Set(resort.hourly.map(h => h.time.slice(0, 10))))
  const idx = Math.max(0, Math.min(dayIndex, dates.length - 1))
  const date = dates[idx]
  const daily = dailyFor(resort, date)
  const w = daily.worst.peak
  const meta = TIERS[daily.tier]
  const factors = factorsFor(daily.worst)
  const score = overallScore(daily.worst)
  const better = betterWindow(resort, daily, idx, idx === 0 ? nowMinutes(snapshot) : 0)
  const when = idx === 0 ? '今天' : idx === 1 ? '明天' : `周${'日一二三四五六'[new Date(`${date}T12:00:00+08:00`).getDay()]}`
  const keyReason = daily.tier === 'hell'
    ? (w.gust >= 75 ? '阵风达到缆车停运阈值；一旦停运，撤离和救援都会更困难，安全优先。' : w.vis != null && w.vis < 500 ? '能见度过低，雪道边界和同伴都难以辨认，容易迷路或碰撞。' : '风力或体感达到危险级别，山上暴露风险高。')
    : daily.tier === 'poor'
      ? '风或能见度会影响缆车运行和雪道辨识；如要上山，避开最差时段。'
      : daily.tier === 'okay'
        ? '风略大或能见度一般，但未达到缆车明显受影响的程度。'
        : '能见度高、风小、体感可接受，是当天最好的窗口。'

  return (
    <BottomSheet onClose={onClose} label="建议依据">
      <SheetHandle />
      <div className="sheet-head">
        <div>
          <div className="sheet-title">建议依据</div>
          <div className="sheet-sub">{when} 08:00–17:00 · {resort.short} · 最差 {fmtTime(daily.worst.time)}</div>
        </div>
        <SheetClose onClose={onClose} />
      </div>

      <div className={`why-verdict tier-${daily.tier}`} style={{ background: `linear-gradient(135deg,${rgba(meta.color, 0.34)},${rgba(meta.color, 0.08)}),rgba(15,23,34,.82)`, borderColor: rgba(meta.color, 0.42) }}>
        <div className="big-glyph"><Icon name={meta.icon} size={23} /></div>
        <div className="text">
          <b>{meta.label}</b>
          <small>综合适宜度 {score} / 100 · 分数越高越适合</small>
        </div>
      </div>

      <div className="why-summary">{reasonFor(daily.tier, daily.worst)}。</div>

      <div className="factors">
        {factors.map(f => (
          <div className="factor" key={f.name}>
            <div className="factor-top">
              <span className="fname"><Icon name={f.icon} size={12} />{f.name}</span>
              <span><span className="fval">{f.value}</span><span className="fscore">{f.score}/100</span></span>
            </div>
            <div className="bar"><i style={{ width: `${Math.max(3, Math.min(100, f.score))}%`, background: f.color }} /></div>
          </div>
        ))}
      </div>

      <div className="why-block"><h4>关键原因</h4><p>{keyReason}</p></div>
      <div className="why-block"><h4>更好时段</h4><p><b>{better}</b></p></div>

      <button className="why-cta" onClick={onOpenWind}>查看风力详情 <Icon name="chevron" size={13} /></button>
      <div className="why-foot">
        仅评估日间 08:00–17:00；缆车状态为天气估算，非雪场官方公告。<br />
        数据：Open-Meteo · {snapshot.generatedAt.slice(11, 16)}
      </div>
    </BottomSheet>
  )
}
