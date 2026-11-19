import { ROAD_DATA, roadStateColor } from '../lib/status'
import { BottomSheet, SheetClose, SheetHandle } from './Common'

export function RouteSheet({ selectedId, onSelect, onClose }: {
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <BottomSheet onClose={onClose} label="切换路线">
      <SheetHandle />
      <div className="sheet-head">
        <div><div className="sheet-title">切换路线</div><div className="sheet-sub">北京 → 崇礼 · 3 条主要路线</div></div>
        <SheetClose onClose={onClose} />
      </div>
      <div className="switch-list">
        {ROAD_DATA.routes.map(r => {
          const color = roadStateColor(r.stateKey)
          const on = r.id === selectedId
          return (
            <button key={r.id} className={`switch-row${on ? ' on' : ''}`} onClick={() => onSelect(r.id)}>
              <span className="dot" style={{ background: color, boxShadow: `0 0 0 3px ${color}24` }} />
              <span className="sw-main">
                <span className="sw-name">{r.name} <span style={{ fontSize: 8, color: 'var(--ink3)', fontWeight: 400 }}>{r.code}</span></span>
                <span className="sw-sub">{r.meta} · {r.duration}</span>
              </span>
              <span className="sw-right" style={{ color, fontSize: 10 }}>{r.state}</span>
              <span className="sw-check">{on ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>
      <div className="sheet-foot">封路与路况信息以官方发布为准 · 数据 {ROAD_DATA.updatedAt.slice(11, 16)}</div>
    </BottomSheet>
  )
}
