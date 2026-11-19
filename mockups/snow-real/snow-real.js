/* 雪道真实图建模 + 时间轴效果图 */
(function () {
  'use strict';
  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    road: '<path d="M6 21 9 3M18 21 15 3M12 5v3M12 11v3M12 17v3"/>',
    trail: '<path d="M3 19h18L14 6l-3.5 6.5L8 9l-5 10Z"/><path d="m10.5 12.5 2-2 2 2"/>',
    pin: '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  function icon(name, size, cls) {
    return '<svg class="icon ' + (cls || '') + '" width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function statusbar() {
    return '<div class="statusbar"><span>17:08</span><span class="island"></span><span class="status-icons"><span class="sig"><i></i><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></span></div>';
  }
  function tabbar(active) {
    const tabs = [
      { id: 'weather', label: '天气', icon: 'sun' },
      { id: 'road', label: '路况', icon: 'road' },
      { id: 'snow', label: '雪道', icon: 'trail' }
    ];
    return '<nav class="tabbar" aria-label="模块切换">' + tabs.map(t => '<button class="tab ' + (active === t.id ? 'on' : '') + '" onclick="goTab(\'' + t.id + '\')">' + icon(t.icon, 19) + '<span>' + t.label + '</span></button>').join('') + '<span class="tab-sep"></span><button class="tab-ham" aria-label="切换雪场"><i></i><i></i><i></i></button></nav>';
  }

  const STATE = {
    now: { key: 'now', label: '11/18 17:08', short: '现在', pos: 16, open: 8, actual: 8, expected: 0, counts: [3, 4, 1, 0], next: 2, event: 0 },
    tomorrow: { key: 'tomorrow', label: '11/19 09:00', short: '明天 09:00', pos: 39, open: 10, actual: 8, expected: 2, counts: [3, 4, 3, 0], next: 1, event: 2 },
    dayafter: { key: 'dayafter', label: '11/20 09:00', short: '后天 09:00', pos: 63, open: 11, actual: 8, expected: 3, counts: [3, 4, 4, 0], next: 0, event: 3 },
    final: { key: 'final', label: '11/21 09:00', short: '周六 09:00', pos: 87, open: 12, actual: 8, expected: 4, counts: [3, 4, 4, 1], next: 0, event: 4 }
  };
  const RANK = { now: 0, tomorrow: 1, dayafter: 2, final: 3 };
  const TRAILS = [
    { id: 'chang', name: '长龙道', diff: 'green', opened: 'now', d: 'M188 58 C145 95 115 140 78 185 C54 215 40 250 44 292', lx: 76, ly: 172 },
    { id: 'you', name: '游龙道', diff: 'green', opened: 'now', d: 'M190 60 C160 105 132 150 110 195 C94 228 92 262 102 296', lx: 107, ly: 218 },
    { id: 'wo', name: '卧龙道', diff: 'green', opened: 'now', d: 'M168 230 C154 248 143 270 138 296', lx: 140, ly: 268 },
    { id: 'teng', name: '腾龙道', diff: 'blue', opened: 'now', d: 'M194 60 C190 108 180 158 160 205 C150 235 148 265 154 296', lx: 154, ly: 164 },
    { id: 'zhong', name: '中华龙道', diff: 'blue', opened: 'now', d: 'M198 58 C205 110 214 158 225 205 C232 238 230 268 224 296', lx: 222, ly: 188 },
    { id: 'wucai', name: '五彩龙道', diff: 'blue', opened: 'now', d: 'M202 60 C228 100 248 140 268 182 C283 212 286 248 280 282', lx: 249, ly: 210 },
    { id: 'xue', name: '雪龙道', diff: 'blue', opened: 'now', d: 'M206 62 C240 100 265 135 288 172 C305 200 312 235 308 268', lx: 282, ly: 188 },
    { id: 'wei', name: '威龙道', diff: 'black', opened: 'now', d: 'M200 58 C210 100 220 140 232 178 C245 215 250 250 248 282', lx: 233, ly: 156 },
    { id: 'yu', name: '玉龙道', diff: 'black', opened: 'tomorrow', d: 'M206 56 C230 92 252 128 272 166 C290 198 296 232 292 265', lx: 264, ly: 150 },
    { id: 'yin', name: '银龙道', diff: 'black', opened: 'tomorrow', d: 'M212 54 C248 85 278 120 300 158 C320 190 326 222 322 255', lx: 298, ly: 145 },
    { id: 'jin', name: '金龙道', diff: 'black', opened: 'dayafter', d: 'M220 52 C262 78 296 110 318 148 C338 180 342 212 338 245', lx: 318, ly: 136 },
    { id: 'daben', name: '大奔头', diff: 'double', opened: 'final', d: 'M230 50 C274 72 310 102 334 138 C352 170 356 200 352 230', lx: 337, ly: 125 }
  ];
  const EVENTS = [
    { at: '11/18 08:30', type: 'open', text: '<b>官方开板</b> · 主要雪道 8 条、缆车 3 条', src: '万龙公众号' },
    { at: '11/18 17:08', type: 'info', text: '当前快照 · 8 条开放，4 条关闭', src: '本应用' },
    { at: '11/19 09:00', type: 'future', text: '预计开放 <b>玉龙道、银龙道</b>（官方预计）', src: '万龙公众号' },
    { at: '11/20 09:00', type: 'future', text: '预计开放 <b>金龙道</b>，视造雪进度', src: '官方预计' },
    { at: '11/21 09:00', type: 'future', text: '预计开放 <b>大奔头</b>，以当日公告为准', src: '待确认' }
  ];
  function stateFromQuery() {
    const q = new URLSearchParams(location.search);
    return STATE[q.get('state')] || STATE.now;
  }
  function diffColor(d) { return d === 'green' ? '#30D158' : d === 'blue' ? '#0A84FF' : d === 'black' ? '#F2F5F7' : '#FF9F0A'; }
  function statusOf(t, state) {
    if (t.opened === 'now') return 'open';
    if (RANK[state.key] >= RANK[t.opened]) return 'expected';
    return 'closed';
  }
  function isNew(t, state) { return t.opened === state.key && state.key !== 'now'; }

  function trailMap(state, highlight) {
    const openCount = state.open;
    return '<svg class="real-map" viewBox="0 0 360 330" role="img" aria-label="万龙滑雪场雪道开放图，' + state.label + '">' +
      '<defs>' +
        '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#122638"/><stop offset="1" stop-color="#0a141e"/></linearGradient>' +
        '<linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e8f2" stop-opacity=".24"/><stop offset="1" stop-color="#466579" stop-opacity=".04"/></linearGradient>' +
        '<filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>' +
      '<rect width="360" height="330" fill="url(#sky)"/>' +
      // terrain silhouette
      '<path d="M0 268 48 200 84 220 132 126 168 156 212 78 268 126 310 102 360 142V330H0Z" fill="url(#mtn)"/>' +
      // contour lines
      '<g fill="none" stroke="rgba(255,255,255,.10)" stroke-width="1">' +
        '<path d="M0 246 62 190 100 208 148 120 184 150 224 88 276 130 320 108 360 140"/>' +
        '<path d="M0 282 52 218 92 236 138 150 174 176 216 112 270 150 314 128 360 162"/>' +
        '<path d="M14 312 66 250 106 266 154 184 190 208 232 146 286 182 330 160 360 184"/>' +
      '</g>' +
      // trees
      '<g fill="rgba(20,52,54,.55)">' +
        '<path d="m28 300 7-18 7 18Z"/><path d="m52 306 6-14 6 14Z"/><path d="m76 298 5-13 5 13Z"/>' +
        '<path d="m300 300 7-19 7 19Z"/><path d="m324 308 6-15 6 15Z"/><path d="m340 292 5-13 5 13Z"/>' +
        '<path d="m18 250 6-15 6 15Z"/><path d="m42 240 5-12 5 12Z"/>' +
      '</g>' +
      // base / summit buildings
      '<g fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.35)" stroke-width="1">' +
        '<rect x="152" y="296" width="58" height="15" rx="3"/><path d="m152 296 29-12 29 12"/>' +
        '<rect x="183" y="48" width="16" height="10" rx="2"/><path d="m183 48 8-7 8 7"/>' +
      '</g>' +
      '<text x="168" y="323" font-size="7" fill="rgba(255,255,255,.5)">山底 · 1600m</text>' +
      '<text x="202" y="42" font-size="7" fill="rgba(255,255,255,.5)">山顶 · 2110m</text>' +
      // lifts
      '<g stroke="rgba(255,255,255,.38)" stroke-width="1.1" stroke-dasharray="4 4">' +
        '<path d="M78 302 112 174 150 82"/><path d="M168 302 186 178 195 68"/><path d="M264 302 288 190 310 104"/>' +
      '</g>' +
      '<g fill="rgba(255,255,255,.62)">' +
        '<circle cx="78" cy="302" r="2"/><circle cx="112" cy="174" r="2"/><circle cx="150" cy="82" r="2"/>' +
        '<circle cx="168" cy="302" r="2"/><circle cx="186" cy="178" r="2"/><circle cx="195" cy="68" r="2"/>' +
        '<circle cx="264" cy="302" r="2"/><circle cx="288" cy="190" r="2"/><circle cx="310" cy="104" r="2"/>' +
      '</g>' +
      '<text x="88" y="190" font-size="6.5" fill="rgba(255,255,255,.35)">1索</text><text x="177" y="190" font-size="6.5" fill="rgba(255,255,255,.35)">2索</text><text x="278" y="198" font-size="6.5" fill="rgba(255,255,255,.35)">3索</text>' +
      // trails
      TRAILS.map(t => {
        const st = statusOf(t, state);
        const active = highlight ? t.id === highlight : false;
        const newly = isNew(t, state);
        const expected = st === 'expected';
        const color = st === 'open' || expected ? diffColor(t.diff) : '#788795';
        const width = active ? 5 : newly || expected ? 4.3 : 3.2;
        const dash = st === 'open' ? '' : expected ? ' stroke-dasharray="4 4"' : ' stroke-dasharray="2 4"';
        const opacity = st === 'open' ? (active ? 1 : .94) : expected ? .95 : .42;
        return '<g' + (newly || expected ? ' filter="url(#glow)"' : '') + '>' +
          '<path d="' + t.d + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round"' + dash + ' opacity="' + opacity + '"/>' +
          '<text x="' + t.lx + '" y="' + t.ly + '" font-size="7.5" fill="' + (active ? '#fff' : 'rgba(255,255,255,.8)') + '" stroke="rgba(8,16,24,.75)" stroke-width="2" paint-order="stroke">' + t.name + '</text>' +
        '</g>';
      }).join('') +
      // north / legend
      '<g opacity=".55"><text x="330" y="304" font-size="8" fill="#fff">N</text><path d="M334 308v-12m0 0-3 4m3-4 3 4" stroke="#fff" stroke-width="1"/></g>' +
      '<text x="12" y="20" font-size="7" fill="rgba(255,255,255,.4)">基于官方雪道图重绘 · 主要雪道 ' + openCount + '/12 条' + (state.expected ? '（含预计 ' + state.expected + '）' : '开放') + '</text>' +
      '</svg>';
  }

  function snowContent(state, highlight) {
    return '<main class="screen with-tabs">' +
      '<div class="page-head"><span class="left">' + icon('pin', 11) + '崇礼 · 红花梁</span><span class="right">' + icon('refresh', 11) + '更新于 17:08</span></div>' +
      '<div class="page-title">雪道开放</div>' +
      '<div class="page-sub">万龙滑雪场 · 官方公众号 16:40 更新 · 时间轴演示</div>' +
      '<div class="real-summary"><div class="real-big"><div class="k">' + state.short + (state.expected ? '预计开放' : '开放') + '</div><div class="v">' + state.open + '<small>/ 32 条</small></div><div class="s">' + (state.expected ? '实开 ' + state.actual + ' + 预计 ' + state.expected : '主要雪道 12 条中 ' + state.open + ' 条开放') + '</div></div><div class="real-side"><div class="line"><span>缆车</span><b>3 / 7</b></div><div class="line"><span>初级</span><b>' + state.counts[0] + ' 条</b></div><div class="line"><span>中级</span><b>' + state.counts[1] + ' 条</b></div><div class="line"><span>高级</span><b>' + state.counts[2] + ' 条</b></div></div></div>' +
      '<div class="real-map-card"><div class="real-map-head"><div><div class="real-map-title">雪道开放图</div><div class="real-map-sub">实线=已开放 · 虚线=预计 · 灰色=关闭</div></div><div class="time-badge">' + state.label + '</div></div>' + trailMap(state, highlight) + '<div class="map-note"><span>示意图，非官方比例</span><span>光晕 + 虚线 = 预计开放</span></div></div>' +
      '<div class="time-card"><div class="time-head"><div><div class="time-title">开放时间轴</div><div class="time-sub">拖动或点击节点，查看不同时间</div></div><button class="time-now" onclick="goState(\'now\')">回到现在</button></div>' +
        '<div class="time-rail"><div class="rail-line"></div><div class="rail-fill" style="width:' + state.pos + '%"></div>' +
          '<div class="rail-dot green" style="left:12%"></div><div class="rail-dot future" style="left:39%"></div><div class="rail-dot future" style="left:63%"></div><div class="rail-dot future" style="left:87%"></div>' +
          '<div class="rail-knob" style="left:' + state.pos + '%"></div></div>' +
        '<div class="rail-labels"><span><b>11/18</b></span><span>11/19</span><span>11/20</span><span>11/21</span></div>' +
        '<div class="time-events">' + EVENTS.map((e, i) => '<div class="time-event ' + (e.type === 'future' ? 'future ' : '') + (i === state.event ? 'active' : '') + '"><span class="te-dot"></span><span class="te-time">' + e.at + '</span><span>' + e.text + ' <span style="color:var(--ink4)">· ' + e.src + '</span></span></div>').join('') + '</div>' +
        '<div class="trail-actions"><span>拖动时间轴查看 <b>动态开放过程</b></span><button style="font-size:8.5px;color:var(--ink2);display:flex;align-items:center;gap:2px" onclick="goState(\'tomorrow\')">明天 <b style="color:#fff">+2 条</b> ' + icon('chevron', 10) + '</button></div>' +
      '</div>' +
      '<div class="ghost-note">雪道几何按官方图重绘，仅用于开放状态示意；正式版需获得雪场授权或使用授权底图。时间轴中的未来开放时间为官方预计，可能因造雪/天气调整。</div>' +
    '</main>';
  }
  function bg() { return '<div class="bg bg-snow"></div>'; }
  function snow(state) {
    return '<div class="app">' + bg() + statusbar() + snowContent(state) + tabbar('snow') + '</div>';
  }
  function detail(state) {
    const trail = TRAILS.find(t => t.id === 'yu');
    const trailStatus = statusOf(trail, state);
    const open = trailStatus === 'open';
    const expected = trailStatus === 'expected';
    const highlight = 'yu';
    return '<div class="app">' + bg() + statusbar() + snowContent(state, highlight) + tabbar('snow') +
      '<div class="detail-scrim"></div><div class="detail-sheet" role="dialog" aria-modal="true" aria-label="雪道详情">' +
        '<div class="handle"></div><div class="detail-head"><div><div class="detail-title">玉龙道</div><div class="detail-sub">万龙滑雪场 · 高级道 · 山顶 2110m</div></div><button class="detail-close" onclick="goState(\'' + state.key + '\')">' + icon('close', 13) + '</button></div>' +
        '<span class="detail-pill" style="color:' + (open ? '#8EE6A8' : expected ? '#9ED4FF' : '#FFB3AD') + ';background:' + (open ? 'rgba(48,209,88,.14)' : expected ? 'rgba(10,132,255,.14)' : 'rgba(255,69,58,.13)') + ';border:1px solid ' + (open ? 'rgba(48,209,88,.26)' : expected ? 'rgba(10,132,255,.26)' : 'rgba(255,69,58,.24)') + '">' + (open ? '开放 · 本次新增' : expected ? '预计开放 · 官方预计' : '关闭 · 造雪中') + '</span>' +
        '<div class="detail-block"><h4>状态变化</h4><p>' + (open ? '<b>11/19 09:00 开放</b> · 本次新增' : expected ? '<b>11/19 09:00 预计开放</b> · 官方预计，待当日确认' : '<b>关闭 · 造雪中</b> · 预计 11/19 09:00 开放') + '</p></div>' +
        '<div class="detail-map">' + trailMap(state, highlight) + '</div>' +
        '<div class="detail-block"><h4>来源</h4><p>万龙滑雪场公众号 · 11/18 16:40<br><span style="color:var(--ink4)">“玉龙道、银龙道造雪中，预计明日开放”</span></p></div>' +
        '<div class="detail-block"><h4>时间轴</h4><div class="timeline mini"><div class="tl-item closed"><div class="tl-time">11/16 18:00</div><div class="tl-text">关闭 · 开始造雪</div></div><div class="tl-item"><div class="tl-time">11/18 16:40</div><div class="tl-text">官方公众号：造雪中，预计 11/19 开放</div></div><div class="tl-item ' + (open ? '' : 'future') + '"><div class="tl-time">11/19 09:00</div><div class="tl-text">' + (open ? '已开放（本次新增）' : '预计开放（待确认）') + '</div></div></div></div>' +
        '<div class="detail-actions"><button>查看公众号原文</button><button class="primary">加入开放提醒</button></div>' +
        '<div class="detail-foot">雪道几何为授权/重绘示意；状态来自官方公众号人工整理，开放时间可能调整。</div>' +
      '</div></div>';
  }

  const q = new URLSearchParams(location.search);
  const state = stateFromQuery();
  const screen = q.get('screen') || 'snow';
  document.getElementById('app').innerHTML = screen === 'detail' ? detail(state) : snow(state);

  window.goState = function (key) {
    const u = new URL(location.href);
    u.searchParams.set('screen', 'snow');
    u.searchParams.set('state', key);
    location.href = u.toString();
  };
  window.goTab = function (tab) {
    if (tab === 'snow') { window.goState('now'); return; }
    location.href = '../modules/index.html?screen=' + tab;
  };
})();
