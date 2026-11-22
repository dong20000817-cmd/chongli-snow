import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { STATUS_ORDER, STATUS_META, type TrailDigest, type TrailStatus } from '../lib/trails'
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

function Row({ row }: { row: TrailDigest['rows'][number] }) {
  return (
    <div className={`tc-row${row.done ? ' done' : ''}`}>
      <div className="tc-row-head">
        <div className="tc-row-name">
          <b>{row.resort.short}</b>
          {row.done && <span className="tc-ok">✓</span>}
        </div>
        <div className="tc-row-count"><span>已开放 </span><b>{row.opened}</b><span> / {row.total} {row.hasSplit ? '段' : '条'}</span></div>
      </div>

      {row.extras.length > 0 && <div className="tc-row-tags">含{row.extras.join(' / ')}</div>}
      {row.groups.map(g => (
        <div className="tc-group" key={g.status}>
          <span className="tc-group-label" style={{ color: STATUS_META[g.status].color }}>{STATUS_META[g.status].label}</span>
          <span className="tc-group-names">{g.names.join('、')}</span>
        </div>
      ))}
      {!row.groups.length && <div className="tc-group"><span className="tc-group-label quiet">今日</span><span className="tc-group-names quiet">无变化</span></div>}
    </div>
  )
}

export const TrailDigestCard = forwardRef<HTMLDivElement, {
  digest: TrailDigest
  size: '3:4' | '9:16'
  handle?: string
}>(function TrailDigestCard({ digest, size, handle = '董次打次' }, ref) {
  const tall = size === '9:16'
  const active = STATUS_ORDER.filter(s => s !== 'open' && digest.totals[s] > 0)
  return (
    <div ref={ref} className={`trail-card${tall ? ' tall' : ''}`}>
      <div className="tc-glow" />
      <div className="tc-head">
        <div className="tc-top">
          <div className="tc-brand"><Icon name="snowflake" size={14} /><span>滑雪天气通</span></div>
          <div className="tc-date">{digest.dateLabel} · {digest.time}</div>
        </div>
        <div className="tc-title">雪道情报</div>
        <div className="tc-totals">
          {active.length ? active.map(s => <StatusChip key={s} status={s} count={digest.totals[s]} />) : (
            <span className="tc-empty">今天还没有变化</span>
          )}
        </div>
      </div>

      <div className="tc-list">
        {digest.rows.length === 0 && <div className="tc-none">还没有录入任何雪场</div>}
        {digest.rows.map(row => <Row key={row.resort.id} row={row} />)}
      </div>

      <div className="tc-foot">
        <span className="tc-handle">@{handle.replace(/^@/, '')}</span>
      </div>
    </div>
  )
})
