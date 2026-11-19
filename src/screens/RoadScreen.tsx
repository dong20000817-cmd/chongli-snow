import { ROAD_DATA, isToday, roadStateColor, timeOf, type RoadSegment } from '../lib/status'
import { Icon } from '../components/Icons'

function segmentClass(s: RoadSegment): string {
  if (s.status === 'open') return 'open'
  if (s.status === 'slow') return 'slow'
  return 'closed'
}

export function RoadScreen({ routeId, onSelectRoute, today }: { routeId: string; onSelectRoute: (id: string) => void; today: string }) {
  const route = ROAD_DATA.routes.find(r => r.id === routeId) ?? ROAD_DATA.routes[0]
  const overall = ROAD_DATA.overall
  const color = roadStateColor(route.stateKey)
  return (
    <main className="screen with-tabs road-screen">
      <div className="page-head">
        <span className="left"><Icon name="pin" size={11} />北京 → 崇礼</span>
        <span className="right"><Icon name="refresh" size={11} />更新于 {timeOf(ROAD_DATA.updatedAt)}</span>
      </div>
      <div className="page-title">路况</div>
      <div className="page-sub">
        {overall.meta} · 路况 2–5 分钟刷新
        {ROAD_DATA.isDemo && <span className="demo-pill">示例数据</span>}
        {!isToday(ROAD_DATA.updatedAt, today) && <span className="demo-pill" style={{ color: '#FFB3AD', background: 'rgba(255,69,58,.12)', borderColor: 'rgba(255,69,58,.22)' }}>非今日数据</span>}
      </div>

      <div className={`road-overall ${overall.level === 'good' ? 'good' : overall.level === 'bad' ? 'bad' : ''}`}>
        <div className="road-overall-top">
          <div className="glyph"><Icon name="warning" size={18} /></div>
          <div>
            <div className="label">{overall.label}</div>
            <div className="window">{overall.desc}</div>
          </div>
        </div>
        <div className="foot"><span>封路信息以高速交警 / 交通委为准</span><b>向下看封路详情 <Icon name="chevron" size={10} /></b></div>
      </div>

      <div className="chip-row">
        {ROAD_DATA.routes.map(r => (
          <button key={r.id} className={`chip${r.id === route.id ? ' on' : ''}`} onClick={() => onSelectRoute(r.id)}>
            <span className="dot" style={{ background: roadStateColor(r.stateKey) }} />{r.name}
          </button>
        ))}
      </div>

      <div className="route-summary">
        <div>
          <div className="name">{route.name} <span style={{ fontSize: 9, color: 'var(--ink3)', fontWeight: 400 }}>{route.code}</span></div>
          <div className="meta">{route.meta}<br />{route.distance} · {route.duration}</div>
        </div>
        <div className="state" style={{ color, background: `${color}22`, border: `1px solid ${color}44` }}>{route.state}</div>
      </div>

      {route.closure ? (
        <div className="closure-card">
          <div className="closure-head"><div className="closure-title">{route.closure.road}</div><span className="closure-badge">封闭</span></div>
          <div className="closure-road">{route.closure.segment}</div>
          <div className="closure-detail">{route.closure.reason} · 开始 {route.closure.startedAt}</div>
          <div className="closure-grid">
            <div className="closure-cell"><small>预计恢复</small><b>{route.closure.eta}</b></div>
            <div className="closure-cell"><small>绕行</small><b>{route.closure.detour}</b></div>
          </div>
          <div className="closure-foot"><span>来源：{route.closure.source} · {route.closure.sourceTime}</span><span>非官方导航建议</span></div>
        </div>
      ) : (
        <div className="advice"><b>当前路线无官方封路信息。</b> 仍可能因事故/天气临时管制，出发前请再看导航。</div>
      )}

      <div className="route-line">
        {route.segments.map(s => (
          <div key={s.name} className={`route-node ${segmentClass(s)}`}>
            <span className="node-dot" />
            <div className="node-main">
              <div><div className="node-name">{s.name}</div><div className="node-sub">{s.sub}</div></div>
              <div className="node-state" style={{ color: s.status === 'open' ? '#8EE6A8' : s.status === 'slow' ? '#FFD8A8' : '#FFB3AD' }}>{s.state}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }}>
        <div style={{ fontSize: 11, fontWeight: 650 }}>沿线能见度</div>
        <div style={{ fontSize: 8, color: 'var(--ink4)' }}>天气模型 · 非路面实测</div>
      </div>
      <div className="visibility-strip" style={{ gridTemplateColumns: `repeat(${route.visibility.length},1fr)` }}>
        {route.visibility.map(v => (
          <div className="vis-cell" key={v.name}>
            <div className="vn">{v.name}</div><div className="vv">{v.vis}</div><div className="vi">{v.temp} · 能见度</div>
          </div>
        ))}
      </div>

      <div className="advice">
        <b>出发建议：</b>{route.closure ? '当前路线有封闭段，建议改走京藏 + 张承，或等预计恢复后再出发；' : '当前路线可通行，' }大海陀 / 太子城段能见度偏低，注意雾、雪和暗冰。
      </div>

      <div className="source-line">
        路况来源：{ROAD_DATA.source} · {ROAD_DATA.isDemo ? '当前为演示数据' : '以官方发布为准'}<br />
        封路信息以官方发布为准；山区天气变化快，出发前请再看导航。
        <a className="dev-link" href="#/dev">开发者</a>
      </div>
    </main>
  )
}
