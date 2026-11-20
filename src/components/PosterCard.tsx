import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from './Icons'
import type { PosterData, PosterRow, PosterSettings } from '../lib/poster'
import { bestWindow, posterMeta } from '../lib/poster'
import { TIERS, reasonFor } from '../lib/recommend'
import { fmtVis, rgba, tempShort } from '../lib/format'
import { hourOf } from '../lib/time'
import { levelColor, riskOf, windLevel } from '../lib/wind'
import type { Tier } from '../lib/types'

const TIER_ORDER: Tier[] = ['great', 'okay', 'poor', 'hell']

function areaShort(row: PosterRow): string {
  return row.resort.area.split(' · ')[0]
}

function handleText(settings: PosterSettings): string {
  const h = settings.handle.trim() || '董次打次'
  return h.startsWith('@') ? h : `@${h}`
}

function PosterHead({ data, settings }: { data: PosterData; settings: PosterSettings }) {
  return (
    <div className="p-head">
      <div className="p-brand">
        <Icon name="snowflake" size={15} />
        <span>滑雪天气通</span>
      </div>
      <div className="p-date">{settings.updated ? `${data.dateLabel} · ${data.time}` : data.dateLabel}</div>
    </div>
  )
}

function PosterCounts({ data }: { data: PosterData }) {
  return (
    <div className="p-counts">
      {TIER_ORDER.map(k => {
        const t = TIERS[k]
        return (
          <span key={k} className="p-count" style={{ '--tc': t.color } as CSSProperties}>
            <i />
            {t.label}
            <b>{data.counts[k]}</b>
          </span>
        )
      })}
    </div>
  )
}

function TierPill({ tier, className = '' }: { tier: Tier; className?: string }) {
  const t = TIERS[tier]
  return (
    <span
      className={className}
      style={{ color: t.color, background: rgba(t.color, 0.15), border: `1px solid ${rgba(t.color, 0.32)}` }}
    >
      {t.label}
    </span>
  )
}

function ListRow({ row, index, show }: { row: PosterRow; index: number; show: PosterSettings['show'] }) {
  const t = TIERS[row.daily.tier]
  const meta = posterMeta(row, show)
  return (
    <div
      className={`p-row${index === 0 ? ' top' : ''}`}
      style={{ '--tc': t.color, '--rowsoft': rgba(t.color, 0.13) } as CSSProperties}
    >
      <div className="p-rank">{String(index + 1).padStart(2, '0')}</div>
      <div className="p-main">
        <div className="p-name">
          {row.resort.short}
          <small>{areaShort(row)}</small>
        </div>
        {meta && <div className="p-meta">{meta}</div>}
      </div>
      <TierPill tier={row.daily.tier} className="p-tier" />
      <div className="p-score">
        {row.score}
        <small>/100</small>
      </div>
    </div>
  )
}

function PosterList({ data, settings }: { data: PosterData; settings: PosterSettings }) {
  return (
    <div className="p-list">
      {data.rows.map((row, i) => (
        <ListRow key={row.resort.id} row={row} index={i} show={settings.show} />
      ))}
    </div>
  )
}

function GridCard({ row, show }: { row: PosterRow; show: PosterSettings['show'] }) {
  const t = TIERS[row.daily.tier]
  const meta = posterMeta(row, show, true)
  return (
    <div className="p-card" style={{ '--tc': t.color } as CSSProperties}>
      <div className="pc-top">
        <b>{row.resort.short}</b>
        <span>{areaShort(row)}</span>
      </div>
      <div className="pc-mid">
        <div className="pc-score">
          {row.score}
          <small>/100</small>
        </div>
        <TierPill tier={row.daily.tier} className="pc-tier" />
      </div>
      {meta && <div className="pc-meta">{meta}</div>}
      <div className="pc-bar">
        <i style={{ width: `${row.score}%` }} />
      </div>
    </div>
  )
}

function PosterGrid({ data, settings }: { data: PosterData; settings: PosterSettings }) {
  return (
    <div className="p-grid">
      {data.rows.map(row => (
        <GridCard key={row.resort.id} row={row} show={settings.show} />
      ))}
    </div>
  )
}

function SinglePoster({ row, settings }: { row: PosterRow; settings: PosterSettings }) {
  const t = TIERS[row.daily.tier]
  const p = row.daily.worst.peak
  const risk = riskOf(row.daily.worst)

  const metrics: Array<{ label: string; value: string }> = []
  if (settings.show.temp) {
    metrics.push(
      { label: '山顶温度', value: tempShort(p.temp) },
      { label: '山底温度', value: tempShort(row.daily.worst.base.temp) },
    )
  }
  if (settings.show.feels) metrics.push({ label: '体感温度', value: tempShort(p.feels) })
  if (settings.show.vis) metrics.push({ label: '能见度', value: fmtVis(p.vis) })

  const date = row.daily.date
  const wanted = [8, 10, 12, 14, 16, 18]
  const hours = row.resort.hourly.filter(h => h.time.startsWith(date) && wanted.includes(hourOf(h.time))).slice(0, 6)
  const bars = hours.length ? hours : row.daily.list.slice(0, 6)
  const levels = bars.map(h => windLevel(h.peak.wind))
  const minLevel = levels.length ? Math.min(...levels) : windLevel(p.wind)
  const maxLevel = levels.length ? Math.max(...levels) : windLevel(p.wind)

  const why: Array<{ color: string; title: string; text: string }> = []
  if (settings.show.vis) {
    why.push({ color: '#30D158', title: `能见度 ${fmtVis(p.vis)}`, text: p.vis != null && p.vis >= 5000 ? '全天通透，雪道边界清晰' : '视野一般，注意雪道边界' })
  }
  if (settings.show.wind) {
    why.push({ color: risk.color, title: `山顶风 ${windLevel(p.wind)} 级`, text: `缆车预计${risk.label}${risk.key === 'ok' ? '，不用等风' : '，留意雪场公告'}` })
  }
  if (settings.show.feels) {
    why.push({ color: p.feels != null && p.feels <= -25 ? '#FFD60A' : '#30D158', title: `体感 ${tempShort(p.feels)}`, text: p.feels != null && p.feels <= -25 ? '注意面部防护，勤进暖房' : '正常保暖即可' })
  }
  if (!why.length) {
    why.push({ color: t.color, title: `评分 ${row.score} / 100`, text: TIERS[row.daily.tier].label })
  }

  return (
    <div className="p-single">
      <div className="ps-badge">
        <Icon name="sparkle" size={11} />
        单雪场 · 深度卡
      </div>
      <div className="ps-name">{row.resort.name}</div>
      <div className="ps-area">
        {row.resort.region} · {areaShort(row)} · 山顶 {row.resort.peakElev}m / 山底 {row.resort.baseElev}m
      </div>
      <div className="ps-scoreline">
        <div className="ps-score">{row.score}</div>
        <div className="ps-side">
          <TierPill tier={row.daily.tier} className="ps-tier" />
          <div className="ps-note">今日评分 · {row.score} / 100</div>
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="ps-metrics" style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}>
          {metrics.map(m => (
            <div className="ps-metric" key={m.label}>
              <small>{m.label}</small>
              <b>{m.value}</b>
            </div>
          ))}
        </div>
      )}

      {settings.show.wind && bars.length > 0 && (
        <div className="ps-wind">
          <div className="ps-wind-head">
            <span>未来 6 小时 · 山顶风力</span>
            <b>
              {minLevel === maxLevel ? `${minLevel} 级` : `${minLevel}–${maxLevel} 级`} · 缆车{risk.label}
            </b>
          </div>
          <div className="ps-bars">
            {bars.map(h => {
              const level = windLevel(h.peak.wind)
              return (
                <div className="ps-bar" key={h.time}>
                  <i
                    style={{
                      height: `${Math.min(54, 18 + level * 5)}px`,
                      background: levelColor(level),
                    }}
                  />
                  <small>{h.time.slice(11, 13)}</small>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="ps-best">
        <div>
          <small>最佳时段</small>
          <b>{bestWindow(row)}</b>
        </div>
        <div className="ps-best-note">
          上午光线最好
          <br />
          午后风力略增
        </div>
      </div>

      <div className="ps-why">
        <div className="ps-why-head">为什么是「{TIERS[row.daily.tier].label}」</div>
        {why.map(w => (
          <div className="ps-why-row" key={w.title}>
            <i style={{ background: w.color }} />
            <b>{w.title}</b>
            <span>{w.text}</span>
          </div>
        ))}
      </div>

      <div className="ps-quote">
        <b>一句话：</b>
        {reasonFor(row.daily.tier, row.daily.worst)}
      </div>
    </div>
  )
}


function SingleHighlights({ row }: { row: PosterRow }) {
  const risk = riskOf(row.daily.worst)
  const p = row.daily.worst.peak
  return (
    <div className="p-highlights">
      <div className="ph-head">本场速览</div>
      <div className="ph-row">
        <i style={{ background: '#30D158' }} />
        <b>最佳</b>
        <span>{bestWindow(row)}</span>
      </div>
      <div className="ph-row">
        <i style={{ background: risk.color }} />
        <b>风力</b>
        <span>{windLevel(p.wind)} 级 · 缆车{risk.label}</span>
      </div>
      <div className="ph-row">
        <i style={{ background: '#0A84FF' }} />
        <b>体感</b>
        <span>{tempShort(p.feels)} · 能见度 {fmtVis(p.vis)}</span>
      </div>
      <div className="ph-row">
        <i style={{ background: 'rgba(255,255,255,.5)' }} />
        <b>海拔</b>
        <span>山顶 {row.resort.peakElev}m / 山底 {row.resort.baseElev}m</span>
      </div>
    </div>
  )
}

function Highlights({ data }: { data: PosterData }) {
  return (
    <div className="p-highlights">
      <div className="ph-head">今日看点</div>
      <div className="ph-row">
        <i style={{ background: '#30D158' }} />
        <b>最推荐</b>
        <span>
          {data.best.resort.short} {data.best.score} 分 · {TIERS[data.best.daily.tier].label}
        </span>
      </div>
      <div className="ph-row">
        <i style={{ background: data.risk.color }} />
        <b>风况</b>
        <span>
          {data.wind.resort.short} 阵风 {data.maxGustLevel} 级 · 缆车{data.risk.label}
        </span>
      </div>
      <div className="ph-row">
        <i style={{ background: '#0A84FF' }} />
        <b>体感</b>
        <span>
          最低 {tempShort(data.minFeels)} · 能见度最低 {fmtVis(data.minVis)}
        </span>
      </div>
    </div>
  )
}

export interface PosterCardProps {
  data: PosterData
  settings: PosterSettings
  single?: PosterRow
}

export const PosterCard = forwardRef<HTMLDivElement, PosterCardProps>(function PosterCard(
  { data, settings, single },
  ref,
) {
  const singleRow = single ?? data.best
  return (
    <div ref={ref} className={`poster ${settings.theme}${settings.size === '9:16' ? ' tall' : ''}`}>
      <div className="p-bg" />
      <svg className="p-mtn" viewBox="0 0 540 300" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 212 78 132 132 176 205 92 268 166 330 112 392 180 462 120 540 188V300H0Z" fill="rgba(190,225,255,.09)" />
        <path d="M0 252 96 184 168 228 250 158 322 216 400 174 470 226 540 190V300H0Z" fill="rgba(255,255,255,.045)" />
        <path d="M0 282 110 236 210 268 310 224 420 264 540 232V300H0Z" fill="rgba(4,14,24,.45)" />
      </svg>

      <PosterHead data={data} settings={settings} />
      <div className="p-title">{settings.title}</div>
      <div className="p-sub">
        {settings.layout === 'single' ? '日间 08:00–17:00' : settings.subtitle}
      </div>
      {settings.layout !== 'single' && <PosterCounts data={data} />}

      <div className="p-body">
        {settings.layout === 'grid' && <PosterGrid data={data} settings={settings} />}
        {settings.layout === 'list' && <PosterList data={data} settings={settings} />}
        {settings.layout === 'single' && <SinglePoster row={singleRow} settings={settings} />}
        {settings.size === '9:16' && settings.layout !== 'single' && <Highlights data={data} />}
        {settings.size === '9:16' && settings.layout === 'single' && <SingleHighlights row={singleRow} />}
      </div>

      <div className="p-foot">
        <div className="p-foot-l">
          <b>天气：Open-Meteo</b> · 预报非实况 · 山顶/山底为海拔订正
          {settings.footnote && (
            <>
              <br />
              评估日间 08:00–17:00 · 缆车状态以雪场公告为准
            </>
          )}
        </div>
        <div className="p-handle">{handleText(settings)}</div>
      </div>
    </div>
  )
})
