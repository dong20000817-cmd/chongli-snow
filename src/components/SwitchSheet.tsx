import type { ResortForecast, Snapshot } from '../lib/types'
import { TIERS, dailyFor } from '../lib/recommend'
import { currentHour } from '../lib/time'
import { rgba, tempShort } from '../lib/format'
import { windLevel } from '../lib/wind'
import { BottomSheet, SheetClose, SheetHandle } from './Common'

export function SwitchSheet({ resorts, snapshot, selectedId, onSelect, onClose }: {
  resorts: ResortForecast[]
  snapshot: Snapshot
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <BottomSheet onClose={onClose} label="切换雪场">
      <SheetHandle />
      <div className="sheet-head">
        <div>
          <div className="sheet-title">切换雪场</div>
          <div className="sheet-sub">崇礼 / 金山岭 · {resorts.length} 家</div>
        </div>
        <SheetClose onClose={onClose} />
      </div>
      <div className="switch-list">
        {resorts.map(r => {
          const daily = dailyFor(r, snapshot.today)
          const cur = currentHour(r, snapshot)
          const meta = TIERS[daily.tier]
          const on = r.id === selectedId
          return (
            <button key={r.id} className={`switch-row${on ? ' on' : ''}`} onClick={() => onSelect(r.id)}>
              <span className="dot" style={{ background: meta.color, boxShadow: `0 0 0 3px ${rgba(meta.color, 0.14)}` }} />
              <span className="sw-main">
                <span className="sw-name">
                  {r.name}
                  <span className="mini-pill" style={{ color: meta.color, background: rgba(meta.color, 0.14) }}>{meta.label}</span>
                </span>
                <span className="sw-sub">{r.area} · 山顶 {tempShort(cur.peak.temp)} · {windLevel(cur.peak.wind)}级风</span>
              </span>
              <span className="sw-right">
                {tempShort(cur.base.temp)}
                <small>{windLevel(cur.peak.wind)}级 · 阵风{windLevel(cur.peak.gust)}级</small>
              </span>
              <span className="sw-check">{on ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>
      <div className="sheet-foot">顶部徽标为今天的日间建议 · 数据 {snapshot.generatedAt.slice(11, 16)}</div>
    </BottomSheet>
  )
}
