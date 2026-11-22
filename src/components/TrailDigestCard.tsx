import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import {
  LINE_ORDER,
  STATUS_ORDER,
  STATUS_META,
  digestLine,
  type TrailDigest,
  type TrailStatus,
} from '../lib/trails'
import { Icon } from './Icons'

function StatusChip({ status, count }: { status: TrailStatus; count: number }) {
  if (!count) return null
  const m = STATUS_META[status]
  return (
    <span className="tc-chip" style={{ '--sc': m.color, '--scbg': `${m.color}29`, '--scbd': `${m.color}4d` } as CSSProperties}>
      <i />
      {m.label}
      <b>{count}</b>
    </span>
  )
}

function Row({ row, tall }: { row: TrailDigest['rows'][number]; tall: boolean }) {
  const counts = row.counts
  const badges = LINE_ORDER.filter(s => counts[s] > 0)
  return (
    <div className={`tc-row${row.marked ? '' : ' empty'}${row.done ? ' done' : ''}`}>
      <div className="tc-row-head">
        <div className="tc-row-name">
          <b>{row.resort.short}</b>
          {row.done && <span className="tc-ok">✓</span>}
          {row.marked > 0 && badges.map(s => (
            <span key={s} className="tc-badge" style={{ '--sc': STATUS_META[s].color, '--scbg': `${STATUS_META[s].color}26` } as CSSProperties}>
              <i />
              {STATUS_META[s].short}
              {counts[s]}
            </span>
          ))}
          {!row.marked && <span className="tc-nomark">未录入</span>}
        </div>
        <div className="tc-row-count">
          {row.marked ? <><b>{row.marked}</b><span> / {row.total} 条</span></> : <span>{row.total} 条</span>}
        </div>
      </div>
      {row.marked > 0 && <div className={`tc-line${tall ? ' two' : ''}`}>{digestLine(row, tall ? 12 : 6)}</div>}
      {!row.marked && <div className="tc-line">今天还没标注</div>}
    </div>
  )
}

export const TrailDigestCard = forwardRef<HTMLDivElement, {
  digest: TrailDigest
  size: '3:4' | '9:16'
  handle?: string
}>(function TrailDigestCard({ digest, size, handle = '董次打次' }, ref) {
  const tall = size === '9:16'
  const cardStyle: CSSProperties = { width: 540, height: tall ? 960 : 720 }
  const active = STATUS_ORDER.filter(s => digest.totals[s] > 0)
  return (
    <div ref={ref} className={`trail-card${tall ? ' tall' : ''}`} style={cardStyle}>
      <div className="tc-glow" />
      <div className="tc-head">
        <div className="tc-top">
          <div className="tc-brand"><Icon name="snowflake" size={14} /><span>滑雪天气通</span></div>
          <div className="tc-date">{digest.dateLabel} · {digest.time}</div>
        </div>
        <div className="tc-title">雪道情报</div>
        <div className="tc-sub">{digest.rows.length} 家雪场 · {digest.totalTrails} 条雪道 · 已录 {digest.markedResorts} 家</div>
        <div className="tc-totals">
          {active.length ? active.map(s => <StatusChip key={s} status={s} count={digest.totals[s]} />) : (
            <span className="tc-empty">今天还没录入雪道</span>
          )}
        </div>
      </div>

      <div className="tc-list">
        {digest.rows.map(row => <Row key={row.resort.id} row={row} tall={tall} />)}
      </div>

      <div className="tc-foot">
        <span>人工录入 · 以雪场当日公告为准</span>
        <span className="tc-handle">@{handle.replace(/^@/, '')}</span>
      </div>
    </div>
  )
})
