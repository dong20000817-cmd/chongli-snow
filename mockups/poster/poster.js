/* 天气概览图 / 开发者入口 · 效果图渲染 */

const ICONS = {
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 4.5 7.5 12 15 19.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  refresh: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 11a8 8 0 1 1-2.4-5.7M20 4v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  share: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 15V3m0 0 4 4m-4-4L8 7M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.4" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="9.5" r="1.5" fill="currentColor"/><path d="m21 15-5-5L5 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  chev: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  link: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  sparkle: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2.5c.6 5.1 3.4 7.9 8.5 8.5-5.1.6-7.9 3.4-8.5 8.5-.6-5.1-3.4-7.9-8.5-8.5 5.1-.6 7.9-3.4 8.5-8.5Z" fill="currentColor"/></svg>',
  snow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2.2v19.6M4.4 7l15.2 10M19.6 7 4.4 17"/><path d="M9.4 4.4 12 7l2.6-2.6M9.4 19.6 12 17l2.6 2.6"/></svg>',
  copy: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" stroke-width="1.8"/></svg>',
  printer: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><rect x="7" y="14" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.7"/></svg>',
  folder: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  message: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 9 9 0 0 1-4-.9L3.5 20l1.2-4.6a8 8 0 0 1-1-4.1A8.4 8.4 0 0 1 12.2 3 8.4 8.4 0 0 1 21 11.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  air: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21a9 9 0 1 0-9-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 16a4 4 0 1 0-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>',
  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
}

const STATUS_BAR = `
<div class="statusbar">
  <span class="sb-time">07:30</span>
  <span class="sb-island"></span>
  <span class="sb-icons">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="1" fill="#fff"/><rect x="4.8" y="5" width="3" height="7" rx="1" fill="#fff"/><rect x="9.6" y="2.6" width="3" height="9.4" rx="1" fill="#fff"/><rect x="14.4" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1.2 4.2a10.5 10.5 0 0 1 13.6 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M3.8 7a6.8 6.8 0 0 1 8.4 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M6.4 9.6a3.2 3.2 0 0 1 3.2 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.6" y="0.6" width="23" height="11.8" rx="3.6" fill="none" stroke="#fff" stroke-opacity=".45"/><rect x="2.2" y="2.2" width="17.6" height="8.6" rx="2.2" fill="#fff"/><path d="M25.2 4.2v4.6a2.4 2.4 0 0 0 0-4.6Z" fill="#fff" fill-opacity=".5"/></svg>
  </span>
</div>`

const TIERS = {
  great: { label: '非常建议', color: '#30D158', soft: 'rgba(48,209,88,.15)', line: 'rgba(48,209,88,.32)' },
  okay: { label: '一般建议', color: '#0A84FF', soft: 'rgba(10,132,255,.16)', line: 'rgba(10,132,255,.34)' },
  poor: { label: '不太建议', color: '#FF9F0A', soft: 'rgba(255,159,10,.15)', line: 'rgba(255,159,10,.33)' },
  hell: { label: '地狱难度', color: '#FF453A', soft: 'rgba(255,69,58,.16)', line: 'rgba(255,69,58,.36)' },
}

const ROWS = [
  { name: '万龙', area: '红花梁', tier: 'great', score: 92, temp: -12, base: -6, feels: -19, wind: 2, vis: '15 km' },
  { name: '云顶', area: '太子城', tier: 'great', score: 88, temp: -13, base: -7, feels: -20, wind: 3, vis: '12 km' },
  { name: '太舞', area: '玉石梁', tier: 'great', score: 81, temp: -11, base: -5, feels: -18, wind: 3, vis: '10 km' },
  { name: '富龙', area: '西湾子', tier: 'okay', score: 74, temp: -9, base: -4, feels: -17, wind: 4, vis: '8 km' },
  { name: '银河', area: '翠云山', tier: 'okay', score: 69, temp: -10, base: -5, feels: -18, wind: 4, vis: '7 km' },
  { name: '多乐', area: '喜鹊梁', tier: 'okay', score: 58, temp: -14, base: -8, feels: -22, wind: 4, vis: '6 km' },
  { name: '雪如意', area: '古杨树', tier: 'poor', score: 34, temp: -15, base: -9, feels: -26, wind: 6, vis: '2.4 km' },
  { name: '金山岭', area: '滦平', tier: 'hell', score: 18, temp: -8, base: -3, feels: -24, wind: 8, vis: '0.6 km' },
]

function countTiers(rows = ROWS) {
  const c = { great: 0, okay: 0, poor: 0, hell: 0 }
  rows.forEach(r => { c[r.tier] += 1 })
  return c
}

function countsHTML(rows = ROWS) {
  const c = countTiers(rows)
  return `<div class="p-counts">${['great', 'okay', 'poor', 'hell'].map(k => {
    const t = TIERS[k]
    return `<span class="p-count" style="--tc:${t.color}"><i></i>${t.label}<b>${c[k]}</b></span>`
  }).join('')}</div>`
}

function posterBg() {
  return `<div class="p-bg"></div>
  <svg class="p-mtn" viewBox="0 0 540 300" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 212 78 132 132 176 205 92 268 166 330 112 392 180 462 120 540 188V300H0Z" fill="rgba(190,225,255,.09)"/>
    <path d="M0 252 96 184 168 228 250 158 322 216 400 174 470 226 540 190V300H0Z" fill="rgba(255,255,255,.045)"/>
    <path d="M0 282 110 236 210 268 310 224 420 264 540 232V300H0Z" fill="rgba(4,14,24,.45)"/>
  </svg>`
}

function posterHead(date = '11/20 周五 · 07:30') {
  return `<div class="p-head">
    <div class="p-brand">${ICONS.snow} 滑雪天气通</div>
    <div class="p-date">${date}</div>
  </div>`
}

function posterFoot(o = {}) {
  return `<div class="p-foot">
    <div class="p-foot-l"><b>天气：Open-Meteo</b> · 预报非实况 · 山顶/山底为海拔订正<br>评估日间 08:00–17:00 · 缆车状态以雪场公告为准</div>
    <div class="p-handle">${o.handle || '@滑雪天气通'}</div>
  </div>`
}

function rowHTML(r, i, o = {}) {
  const t = TIERS[r.tier]
  const meta = [
    `山顶 ${r.temp}°`,
    `${r.wind} 级风`,
    `能见度 ${r.vis}`,
    o.showFeels ? `体感 ${r.feels}°` : null,
  ].filter(Boolean).join(' · ')
  return `<div class="p-row${i === 0 ? ' top' : ''}" style="--tc:${t.color};--rowsoft:${t.soft}">
    <div class="p-rank">${String(i + 1).padStart(2, '0')}</div>
    <div class="p-main">
      <div class="p-name">${r.name}<small>${r.area}</small></div>
      <div class="p-meta">${meta}</div>
    </div>
    <div class="p-tier" style="color:${t.color};background:${t.soft};border:1px solid ${t.line}">${t.label}</div>
    <div class="p-score">${r.score}<small>/100</small></div>
  </div>`
}

function posterList(o = {}) {
  const rows = o.rows || ROWS
  const theme = o.theme || 'night'
  return `<div class="poster ${theme}">
    ${posterBg()}
    ${posterHead(o.date)}
    <div class="p-title">${o.title || '今日滑雪指数'}</div>
    <div class="p-sub">${o.subtitle || '崇礼 + 金山岭 · <b>8 家雪场</b> · 日间 08:00–17:00'}</div>
    ${countsHTML(rows)}
    <div class="p-list">${rows.map((r, i) => rowHTML(r, i, o)).join('')}</div>
    ${posterFoot(o)}
  </div>`
}

function cardHTML(r) {
  const t = TIERS[r.tier]
  return `<div class="p-card" style="--tc:${t.color}">
    <div class="pc-top"><b>${r.name}</b><span>${r.area}</span></div>
    <div class="pc-mid">
      <div class="pc-score">${r.score}<small>/100</small></div>
      <div class="pc-tier" style="color:${t.color};background:${t.soft};border:1px solid ${t.line}">${t.label}</div>
    </div>
    <div class="pc-meta">${r.temp}° · ${r.wind} 级风 · ${r.vis}</div>
    <div class="pc-bar"><i style="width:${r.score}%"></i></div>
  </div>`
}

function posterGrid(o = {}) {
  const rows = o.rows || ROWS
  return `<div class="poster ${o.theme || 'night'}">
    ${posterBg()}
    ${posterHead(o.date)}
    <div class="p-title">${o.title || '今日滑雪指数'}</div>
    <div class="p-sub">${o.subtitle || '崇礼 + 金山岭 · <b>8 家雪场</b> · 按评分排序'}</div>
    ${countsHTML(rows)}
    <div class="p-grid">${rows.map(cardHTML).join('')}</div>
    ${posterFoot(o)}
  </div>`
}

function posterSingle(o = {}) {
  const r = ROWS[0]
  const t = TIERS[r.tier]
  const heights = [36, 32, 50, 58, 42, 28]
  const labels = ['08', '10', '12', '14', '16', '18']
  const bars = heights.map((h, i) => `<div class="ps-bar"><i style="height:${h}px;--c:#30D158"></i><small>${labels[i]}</small></div>`).join('')
  return `<div class="poster ${o.theme || 'night'}">
    ${posterBg()}
    ${posterHead(o.date)}
    <div class="p-single">
      <div class="ps-badge">${ICONS.sparkle} 单雪场 · 深度卡</div>
      <div class="ps-name">万龙滑雪场</div>
      <div class="ps-area">崇礼 · 红花梁 · 山顶 2110m / 山底 1600m</div>
      <div class="ps-scoreline">
        <div class="ps-score">92</div>
        <div class="ps-side">
          <span class="ps-tier" style="color:${t.color};background:${t.soft};border:1px solid ${t.line}">${t.label}</span>
          <div class="ps-note">今日最推荐 · 92 / 100</div>
        </div>
      </div>
      <div class="ps-metrics">
        <div class="ps-metric"><small>山顶温度</small><b>-12°</b></div>
        <div class="ps-metric"><small>山底温度</small><b>-6°</b></div>
        <div class="ps-metric"><small>体感温度</small><b>-19°</b></div>
        <div class="ps-metric"><small>能见度</small><b>15 km</b></div>
      </div>
      <div class="ps-wind">
        <div class="ps-wind-head"><span>未来 6 小时 · 山顶风力</span><b>2–3 级 · 缆车正常</b></div>
        <div class="ps-bars">${bars}</div>
      </div>
      <div class="ps-best">
        <div><small>最佳时段</small><b>09:00 – 14:00</b></div>
        <div class="ps-best-note">上午光线最好<br>午后风力略增</div>
      </div>
      <div class="ps-why">
        <div class="ps-why-head">为什么是「非常建议」</div>
        <div class="ps-why-row"><i></i><b>能见度 15 km</b><span>全天通透，雪道边界清晰</span></div>
        <div class="ps-why-row"><i></i><b>山顶风 2 级</b><span>缆车预计正常，不用等风</span></div>
        <div class="ps-why-row"><i class="warn"></i><b>体感 -19°</b><span>需面部防护，每 2 小时进暖房</span></div>
      </div>
      <div class="ps-quote"><b>一句话：</b>今天适合冲早场，上午雪质最硬、光线最好；午后风略起，收板别太晚。</div>
    </div>
    ${posterFoot(o)}
  </div>`
}

/* ---------------- editor ---------------- */

function editorPreview(tab) {
  if (tab === 'style') return posterGrid({ theme: 'night' })
  if (tab === 'text') return posterList({ theme: 'night', title: '11/20 滑雪指数' })
  return posterList({ theme: 'night' })
}

function panelContent() {
  return `
  <div class="ctl">
    <div class="ctl-head"><span>日期</span><b>今天 · 11/20 周五</b></div>
    <div class="seg"><button class="on">今天 11/20</button><button>明天 11/21</button></div>
  </div>
  <div class="ctl">
    <div class="ctl-head"><span>雪场范围</span><b>8 家</b></div>
    <div class="seg"><button class="on">全部 8 家</button><button>崇礼 7 家</button><button>自选 2 家</button></div>
  </div>
  <div class="ctl">
    <div class="ctl-head"><span>显示指标</span><b>温度 · 风级 · 能见度</b></div>
    <div class="chips"><button class="on">山顶温度</button><button class="on">风级</button><button class="on">能见度</button><button>体感</button></div>
  </div>`
}

function panelStyle() {
  return `
  <div class="ctl">
    <div class="ctl-head"><span>版式</span><b>榜单 · 8 行</b></div>
    <div class="layout-row">
      <button class="layout-opt on"><div class="dia"><i></i><i></i><i></i></div><span>榜单</span></button>
      <button class="layout-opt"><div class="dia grid"><i></i><i></i><i></i><i></i></div><span>双列</span></button>
      <button class="layout-opt"><div class="dia one"><i></i></div><span>单雪场</span></button>
    </div>
  </div>
  <div class="ctl">
    <div class="ctl-head"><span>主题</span><b>雪夜</b></div>
    <div class="theme-row">
      <button class="theme-opt on"><i style="background:linear-gradient(160deg,#2d6d9e,#0a2744)"></i>雪夜</button>
      <button class="theme-opt"><i style="background:linear-gradient(160deg,#c98558,#2a2036)"></i>晨光</button>
      <button class="theme-opt"><i style="background:linear-gradient(160deg,#8ea4b2,#354552)"></i>雾雪</button>
    </div>
  </div>
  <div class="ctl">
    <div class="ctl-head"><span>尺寸</span><b>1080 × 1440</b></div>
    <div class="size-row"><button class="size-opt on">3:4 小红书</button><button class="size-opt">9:16 故事</button><button class="size-opt">1:1 方图</button></div>
  </div>`
}

function panelText() {
  return `
  <div class="text-field"><label>主标题 <span>最多 12 字</span></label><div class="text-input">11/20 滑雪指数<span class="caret"></span></div></div>
  <div class="text-field"><label>副标题 <span>最多 24 字</span></label><div class="text-input">崇礼 + 金山岭 · 8 家雪场</div></div>
  <div class="text-field"><label>署名 <span>小红书号 / 昵称</span></label><div class="text-input">@滑雪天气通</div></div>
  <div class="toggle-row"><button class="on"><span class="toggle-dot">✓</span>数据脚注</button><button class="on"><span class="toggle-dot">✓</span>更新时间</button></div>`
}

function screenEditor(tab = 'content') {
  const tabLabel = tab === 'style' ? '版式' : tab === 'text' ? '文字' : '内容'
  return `<div class="scr">
    <div class="scr-bg"></div>
    ${STATUS_BAR}
    <div class="nav">
      <div class="nav-left">
        <a class="back" aria-label="返回">${ICONS.back}</a>
        <div><div class="nav-title">天气概览图</div><div class="nav-sub">每天 07:30 · 微调后保存到相册</div></div>
      </div>
      <button class="nav-action">重置</button>
    </div>
    <div class="preview">
      <div class="preview-inner">${editorPreview(tab)}</div>
      <div class="preview-glare"></div>
    </div>
    <div class="panel">
      <div class="panel-grab"></div>
      <div class="panel-head"><b>微调</b><span><i class="live-dot"></i>实时预览 · ${tabLabel} · 3:4</span></div>
      <div class="panel-tabs">
        <button class="${tab === 'content' ? 'on' : ''}">内容</button>
        <button class="${tab === 'style' ? 'on' : ''}">版式</button>
        <button class="${tab === 'text' ? 'on' : ''}">文字</button>
      </div>
      <div class="panel-body">${tab === 'style' ? panelStyle() : tab === 'text' ? panelText() : panelContent()}</div>
      <button class="save-btn">${ICONS.download} 保存到相册</button>
      <div class="save-hint">1080×1440 · Safari 分享 →「存储图像」进相册</div>
      <div class="homebar"></div>
    </div>
  </div>`
}

/* ---------------- entry ---------------- */

function screenEntry() {
  return `<div class="scr">
    <div class="scr-bg"></div>
    ${STATUS_BAR}
    <div class="nav">
      <div class="nav-left">
        <a class="back" aria-label="返回">${ICONS.back}</a>
        <div><div class="nav-title">开发者简报</div><div class="nav-sub">每天 07:30 · 三张图 + 一段文案</div></div>
      </div>
      <button class="nav-action">${ICONS.refresh} 刷新</button>
    </div>

    <div class="entry-card">
      <div class="ec-thumb"><div class="thumb-inner">${posterList()}</div></div>
      <div class="ec-main">
        <div class="ec-kicker"><span class="new">NEW</span> 每天 07:30 更新</div>
        <div class="ec-title">天气概览图</div>
        <div class="ec-sub">8 家雪场滑雪指数 · 可微调 · 1080×1440</div>
        <div class="ec-actions"><button class="primary">微调并下载</button><button class="ghost">直接保存</button></div>
      </div>
    </div>
    <div class="entry-tip">${ICONS.clock} 明早 07:30 直接打开这一页 · 图片可存相册</div>

    <div class="dev-summary">
      <div class="ds-top">
        <div><div class="ds-k">今日情报</div><div class="ds-big">11/20 周五</div></div>
        <div class="ds-side"><b>8 家雪场</b>天气 · 雪道 · 路况</div>
      </div>
      <div class="ds-desc">三张 3:4 卡片已生成，适合小红书竖版发布。</div>
      <div class="ds-meta">天气快照 07:30 · 雪道 06:58 · 路况 07:12</div>
    </div>

    <div class="digest-head"><h2>01 · 天气图</h2><span>今天的概览图</span></div>
    <div class="digest-preview"><div class="digest-preview-inner">${posterList()}</div></div>
    <div class="homebar"></div>
  </div>`
}

/* ---------------- save / share sheet ---------------- */

function screenSave() {
  return `<div class="scr">
    <div class="scr-bg"></div>
    ${STATUS_BAR}
    <div class="save-preview"><div class="save-preview-inner">${posterList()}</div></div>
    <div class="save-dim"></div>

    <div class="save-tip">
      <div class="st-check">${ICONS.check}</div>
      <div class="st-main">
        <b>已生成 1080 × 1440 PNG</b>
        <span>① 点下方 <em>「存储图像」</em>　② 自动存入 <em>「照片」</em></span>
      </div>
    </div>

    <div class="share-sheet">
      <div class="ss-grab"></div>
      <div class="ss-head"><b>分享</b><span>选项</span></div>
      <div class="ss-file">
        <div class="ss-thumb"><div class="thumb-inner">${posterList()}</div></div>
        <div class="ss-file-main"><b>滑雪天气通-天气-11-20.png</b><small>PNG · 1080 × 1440 · 1.2 MB</small></div>
      </div>

      <div class="ss-apps">
        <div class="ss-app"><div class="ico" style="background:#2F6FEB;color:#fff">${ICONS.air}</div><span>隔空投送</span></div>
        <div class="ss-app"><div class="ico" style="background:#34C759;color:#fff">${ICONS.message}</div><span>信息</span></div>
        <div class="ss-app"><div class="ico" style="background:#3B82F6;color:#fff">${ICONS.mail}</div><span>邮件</span></div>
        <div class="ss-app hot"><div class="ico" style="background:#0A84FF;color:#fff">${ICONS.download}</div><span>存储图像</span><span class="pick">1</span></div>
        <div class="ss-app"><div class="ico" style="background:#636366;color:#fff">${ICONS.copy}</div><span>拷贝</span></div>
        <div class="ss-app"><div class="ico" style="background:#636366;color:#fff">${ICONS.printer}</div><span>打印</span></div>
      </div>

      <div class="ss-div"></div>
      <div class="ss-actions">
        <div class="ss-action hot">
          <div class="sa-ico" style="background:rgba(10,132,255,.22);color:#8FC7FF">${ICONS.image}</div>
          <div class="sa-main"><b>存储图像</b><small>保存到「照片」App</small></div>
          <span class="ss-rec">推荐</span>
          <span class="chev">${ICONS.chev}</span>
        </div>
        <div class="ss-action">
          <div class="sa-ico" style="background:rgba(255,255,255,.08);color:#B9C2CC">${ICONS.folder}</div>
          <div class="sa-main"><b>存储到文件</b><small>选择 iCloud 或本机位置</small></div>
          <span class="chev">${ICONS.chev}</span>
        </div>
        <div class="ss-action">
          <div class="sa-ico" style="background:rgba(255,255,255,.08);color:#B9C2CC">${ICONS.copy}</div>
          <div class="sa-main"><b>拷贝</b><small>复制图片到剪贴板</small></div>
          <span class="chev">${ICONS.chev}</span>
        </div>
        <div class="ss-action">
          <div class="sa-ico" style="background:rgba(255,255,255,.08);color:#B9C2CC">${ICONS.printer}</div>
          <div class="sa-main"><b>打印</b><small>连接打印机或存为 PDF</small></div>
          <span class="chev">${ICONS.chev}</span>
        </div>
      </div>
      <button class="ss-cancel">取消</button>
      <div class="ss-home"></div>
    </div>
  </div>`
}

/* ---------------- overview / variants ---------------- */

function screenOverview() {
  return `<div class="ov">
    <div class="ov-head">
      <div>
        <div class="ov-kicker">SKI WEATHER · POSTER STUDIO</div>
        <div class="ov-title">天气概览图 · 从入口到相册</div>
        <div class="ov-sub">每天 07:30 一张图 · 可微调 · 1080 × 1440 PNG</div>
      </div>
      <div class="ov-badge"><i></i>效果图 · 未改正式代码</div>
    </div>
    <div class="ov-phones">
      <div class="ov-item">
        <div class="ov-label"><b>01</b> 入口</div>
        <div class="phone"><div class="phone-inner">${screenEntry()}</div></div>
        <div class="ov-cap"><b>开发者简报首屏新增入口</b><br>微调并下载 / 直接保存</div>
      </div>
      <div class="ov-item">
        <div class="ov-label"><b>02</b> 微调</div>
        <div class="phone"><div class="phone-inner">${screenEditor('content')}</div></div>
        <div class="ov-cap"><b>内容、版式、文字都可改</b><br>改完实时看预览</div>
      </div>
      <div class="ov-item">
        <div class="ov-label"><b>03</b> 存相册</div>
        <div class="phone"><div class="phone-inner">${screenSave()}</div></div>
        <div class="ov-cap"><b>系统分享 → 存储图像</b><br>2 步进入「照片」</div>
      </div>
    </div>
    <div class="ov-foot"><span>入口：https://dong20000817-cmd.github.io/chongli-snow/#/poster</span><span>榜单 / 双列 / 单雪场 · 三种版式</span></div>
  </div>`
}

function screenVariants() {
  return `<div class="ov" style="height:660px">
    <div class="ov-head">
      <div>
        <div class="ov-kicker">THREE LAYOUTS</div>
        <div class="ov-title">一张图，三种发法</div>
        <div class="ov-sub">同一份天气数据 · 微调面板里随时切换</div>
      </div>
      <div class="ov-badge"><i></i>1080 × 1440 · 3:4</div>
    </div>
    <div class="var-row">
      <div class="var-item"><div class="var-frame"><div class="var-inner">${posterList()}</div></div><div class="var-name">榜单版 · 默认</div><div class="var-desc">8 家雪场按评分排序，信息最全</div></div>
      <div class="var-item"><div class="var-frame"><div class="var-inner">${posterGrid()}</div></div><div class="var-name">双列版</div><div class="var-desc">2 × 4 卡片，适合手机快速扫读</div></div>
      <div class="var-item"><div class="var-frame"><div class="var-inner">${posterSingle()}</div></div><div class="var-name">单雪场版</div><div class="var-desc">主推一家，突出温度和风力</div></div>
    </div>
    <div class="ov-foot"><span>效果图 · 数据为演示，不是今日真实预报</span><span>@滑雪天气通</span></div>
  </div>`
}

/* ---------------- render ---------------- */

function render() {
  const params = new URLSearchParams(location.search)
  const screen = params.get('s') || 'editor'
  const app = document.getElementById('app')
  document.body.className = screen === 'poster' ? 'poster-shot' : ''
  if (screen === 'poster') {
    const v = params.get('v') || 'list'
    app.innerHTML = v === 'grid' ? posterGrid() : v === 'single' ? posterSingle() : posterList()
  } else if (screen === 'entry') {
    app.innerHTML = screenEntry()
  } else if (screen === 'save') {
    app.innerHTML = screenSave()
  } else if (screen === 'overview') {
    app.innerHTML = screenOverview()
  } else if (screen === 'variants') {
    app.innerHTML = screenVariants()
  } else {
    app.innerHTML = screenEditor(params.get('tab') || 'content')
  }
}

render()
