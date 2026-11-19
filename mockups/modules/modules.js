/* 路况 / 雪道 模块效果图 · 静态演示 */
(function () {
  'use strict';
  const D = window.MODULE_DATA;
  const ICONS = {
    pin: '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cloud: '<path d="M6.2 18h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 9.3 4.4 4.4 0 0 0 6.2 18Z"/>',
    fog: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M5 19h14M8 22h8"/>',
    snow: '<path d="M6.2 16.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 7.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M8 19.5v1M12 19.5v1M16 19.5v1M9.5 20.5l-1-.6M14.5 20.5l1-.6M9.5 22l-1 .6M14.5 22l1 .6"/>',
    road: '<path d="M6 21 9 3M18 21 15 3M12 5v3M12 11v3M12 17v3"/>',
    trail: '<path d="M3 19h18L14 6l-3.5 6.5L8 9l-5 10Z"/><path d="m10.5 12.5 2-2 2 2"/>',
    warning: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.2v.2"/>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    cable: '<path d="M3 5.5h18M6 5.5 8.5 19M18 5.5 15.5 19M7.2 12h9.6M8 19h8"/><path d="M10 5.5V9h4V5.5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    snowflake: '<path d="M12 2v20M4 6l16 12M20 6 4 18M8 4l4 4 4-4M8 20l4-4 4 4"/>',
    lift: '<path d="M5 6h14M7 6l2 13M17 6l-2 13M5 19h14"/><rect x="10" y="7.5" width="4" height="4" rx="1"/>',
    map: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"/><path d="M9 4v14M15 6v14"/>',
    alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.2v.2"/>'
  };
  function icon(name, size, cls) {
    return '<svg class="icon ' + (cls || '') + '" width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function statusbar() {
    return '<div class="statusbar"><span>17:08</span><span class="island"></span><span class="status-icons"><span class="sig"><i></i><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></span></div>';
  }
  function bg(cls) { return '<div class="bg ' + cls + '"></div>'; }
  function tabbar(active) {
    const tabs = [
      { id: 'weather', label: '天气', icon: 'sun' },
      { id: 'road', label: '路况', icon: 'road' },
      { id: 'snow', label: '雪道', icon: 'trail' }
    ];
    return '<nav class="tabbar" aria-label="模块切换">' +
      tabs.map(t => '<button class="tab ' + (active === t.id ? 'on' : '') + '" onclick="go(\'' + t.id + '\')">' + icon(t.icon, 19) + '<span>' + t.label + '</span></button>').join('') +
      '<span class="tab-sep"></span>' +
      '<button class="tab-ham" aria-label="切换雪场或路线"><i></i><i></i><i></i></button>' +
      '</nav>';
  }
  function pageHead(region, right) {
    return '<div class="page-head"><span class="left">' + icon('pin', 11) + region + '</span><span class="right">' + icon('refresh', 11) + (right || '更新于 ' + D.updatedAt) + '</span></div>';
  }
  function weather() {
    return '<div class="app">' +
      '<img class="weather-shot" src="../../docs/preview/home.png" alt="天气模块保持原样">' +
      '<div class="weather-veil"></div>' +
      tabbar('weather') +
      '</div>';
  }

  // ---------- road ----------
  function stateColor(key) {
    if (key === 'good') return '#30D158';
    if (key === 'slow' || key === 'bad') return '#FF9F0A';
    return '#FF453A';
  }
  function stateClass(key) { return key === 'open' || key === 'good' ? 'open' : key === 'slow' ? 'slow' : 'closed'; }
  function selectedRoute() {
    const q = new URLSearchParams(location.search);
    return D.road.routes.find(r => r.id === (q.get('route') || 'jingli')) || D.road.routes[0];
  }
  function roadContent() {
    const route = selectedRoute();
    const overall = D.road.overall;
    const vis = route.visibility;
    return '<main class="screen with-tabs">' +
      pageHead('北京 → 崇礼') +
      '<div class="page-title">路况</div>' +
      '<div class="page-sub">' + overall.meta + ' · 路况 2–5 分钟刷新</div>' +
      '<div class="road-overall ' + (overall.level === 'good' ? 'good' : overall.level === 'bad' ? 'bad' : '') + '">' +
        '<div class="road-overall-top"><div class="glyph">' + icon('warning', 18) + '</div><div><div class="label">' + overall.label + '</div><div class="window">' + overall.desc + '</div></div></div>' +
        '<div class="foot"><span>封路信息以高速交警/交通委为准</span><b>查看封路详情 ' + icon('chevron', 10) + '</b></div>' +
      '</div>' +
      '<div class="chip-row">' + D.road.routes.map(r => '<button class="chip ' + (r.id === route.id ? 'on' : '') + '" onclick="go(\'road\',{route:\'' + r.id + '\'})"><span class="dot" style="background:' + stateColor(r.stateKey) + '"></span>' + r.name + '</button>').join('') + '</div>' +
      '<div class="route-summary"><div><div class="name">' + route.name + ' <span style="font-size:9px;color:var(--ink3);font-weight:400">' + route.code + '</span></div><div class="meta">' + route.meta + '<br>' + route.distance + ' · ' + route.duration + '</div></div><div class="state" style="color:' + stateColor(route.stateKey) + ';background:' + stateColor(route.stateKey) + '22;border:1px solid ' + stateColor(route.stateKey) + '44">' + route.state + '</div></div>' +
      (route.closure ? '<div class="closure-card"><div class="closure-head"><div class="closure-title">' + route.closure.road + '</div><span class="closure-badge">封闭</span></div><div class="closure-road">' + route.closure.segment + '</div><div class="closure-detail">' + route.closure.reason + ' · 开始 ' + route.closure.started + '</div><div class="closure-grid"><div class="closure-cell"><small>预计恢复</small><b>' + route.closure.eta + '</b></div><div class="closure-cell"><small>绕行</small><b>' + route.closure.detour + '</b></div></div><div class="closure-foot"><span>来源：' + route.closure.source + ' · ' + route.closure.sourceTime + '</span><span>非官方导航建议</span></div></div>' : '<div class="advice"><b>当前路线无官方封路信息。</b> 仍可能因事故/天气临时管制，出发前请再看导航。</div>') +
      '<div class="route-line">' + route.segs.map(s => '<div class="route-node ' + stateClass(s.status) + '"><span class="node-dot"></span><div class="node-main"><div><div class="node-name">' + s.name + '</div><div class="node-sub">' + s.sub + '</div></div><div class="node-state" style="color:' + (s.status === 'open' ? '#8EE6A8' : s.status === 'slow' ? '#FFD8A8' : '#FFB3AD') + '">' + s.state + '</div></div></div>').join('') + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:13px"><div style="font-size:11px;font-weight:650">沿线能见度</div><div style="font-size:8px;color:var(--ink4)">天气模型 · 非路面实测</div></div>' +
      '<div class="visibility-strip" style="grid-template-columns:repeat(' + vis.length + ',1fr)">' + vis.map(v => '<div class="vis-cell"><div class="vn">' + v.name + '</div><div class="vv">' + v.vis + '</div><div class="vi">' + v.temp + ' · 能见度</div></div>').join('') + '</div>' +
      '<div class="advice"><b>出发建议：</b>京礼高速 19:00 前仍封闭，建议 18:30 后出发或改走京藏 + 张承；大海陀段能见度 1.2 km，注意雾/雪和暗冰。</div>' +
      '<div class="source-line">路况：北京交通 / 河北高速交警 / 高德路况（示意）<br>封路信息以官方发布为准；山区天气变化快。</div>' +
      '</main>';
  }
  function road() {
    return '<div class="app">' + bg('bg-cloud') + statusbar() + roadContent() + tabbar('road') + '</div>';
  }
  function roadDetail() {
    const route = selectedRoute();
    const c = route.closure;
    return '<div class="app">' + bg('bg-cloud') + statusbar() + roadContent() + tabbar('road') +
      '<div class="detail-scrim"></div>' +
      '<div class="detail-sheet" role="dialog" aria-modal="true" aria-label="封路详情">' +
        '<div class="handle"></div><div class="detail-head"><div><div class="detail-title">封路详情</div><div class="detail-sub">' + (c ? c.road : '当前路线') + ' · ' + D.updatedAt + '</div></div><button class="detail-close" onclick="go(\'road\')">' + icon('close', 13) + '</button></div>' +
        (c ? '<span class="detail-pill" style="color:#FFB3AD;background:rgba(255,69,58,.14);border:1px solid rgba(255,69,58,.25)">封闭中</span>' +
          '<div style="font-size:18px;font-weight:720;margin-top:9px">' + c.segment + '</div>' +
          '<div style="font-size:10px;color:var(--ink3);margin-top:3px">' + c.reason + '</div>' +
          '<div class="detail-block"><h4>时间</h4><p>开始 <b>' + c.started + '</b> · ' + c.eta + '</p></div>' +
          '<div class="detail-block"><h4>绕行建议</h4><p><b>' + c.detour + '</b><br>绕行可能受车流影响，请以导航实时路线为准。</p></div>' +
          '<div class="detail-block"><h4>来源</h4><p>' + c.source + ' · ' + c.sourceTime + '<br><span style="color:var(--ink4)">点击查看官方发布（示例链接）</span></p></div>' +
          '<div class="detail-actions"><button>复制路段</button><button class="primary">在导航中打开</button></div>' +
          '<div class="detail-foot">封路信息为天气/路况演示数据；真实上线时以官方发布和导航为准。</div>'
        : '<div class="detail-block"><p>当前路线没有官方封路信息。</p></div>') +
      '</div></div>';
  }

  // ---------- snow ----------
  function diffColor(d) { return d === 'green' ? '#30D158' : d === 'blue' ? '#0A84FF' : d === 'black' ? '#E8EDF2' : '#FF9F0A'; }
  function trailMap(highlight) {
    const trails = [
      { d: 'M52 154 C82 142 96 118 122 112', c: 'green', s: 'open', label: '长龙道', lx: 83, ly: 128 },
      { d: 'M70 161 C102 148 120 130 145 120', c: 'green', s: 'open', label: '游龙道', lx: 105, ly: 146 },
      { d: 'M105 166 C135 150 150 126 175 111', c: 'blue', s: 'open', label: '腾龙道', lx: 133, ly: 123 },
      { d: 'M139 169 C168 151 186 126 206 107', c: 'blue', s: 'open', label: '中华龙道', lx: 166, ly: 136 },
      { d: 'M175 171 C200 151 218 127 235 104', c: 'black', s: 'expected', label: '玉龙道', lx: 201, ly: 114 },
      { d: 'M210 170 C232 149 245 124 258 101', c: 'black', s: 'expected', label: '银龙道', lx: 233, ly: 102 },
      { d: 'M245 168 C262 148 272 126 282 104', c: 'black', s: 'closed', label: '金龙道', lx: 263, ly: 120 },
      { d: 'M276 164 C288 146 295 126 303 108', c: 'double', s: 'closed', label: '大奔头', lx: 292, ly: 108 }
    ];
    return '<svg class="map-svg" viewBox="0 0 340 205" role="img" aria-label="万龙雪道开放示意图">' +
      '<defs><linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfeef7" stop-opacity=".24"/><stop offset="1" stop-color="#5f849b" stop-opacity=".06"/></linearGradient></defs>' +
      '<path d="M12 184 72 134l32 17 48-47 34 20 62-56 70 79v32H12Z" fill="url(#mt)" stroke="rgba(255,255,255,.17)" stroke-width="1"/>' +
      '<path d="M12 184 72 134l32 17 48-47 34 20 62-56 70 79" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>' +
      '<path d="M190 82 214 64l24 18" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1"/>' +
      // lifts
      '<g stroke="rgba(255,255,255,.35)" stroke-width="1.2" stroke-dasharray="4 4"><path d="M54 150 158 88"/><path d="M105 165 235 88"/><path d="M246 164 286 96"/></g>' +
      '<g fill="rgba(255,255,255,.5)"><circle cx="54" cy="150" r="2"/><circle cx="158" cy="88" r="2"/><circle cx="105" cy="165" r="2"/><circle cx="235" cy="88" r="2"/><circle cx="246" cy="164" r="2"/><circle cx="286" cy="96" r="2"/></g>' +
      trails.map(t => {
        const active = highlight && t.label === highlight;
        const color = t.s === 'open' ? diffColor(t.c) : t.s === 'expected' ? '#0A84FF' : '#8B98A6';
        const dash = t.s === 'open' ? '' : t.s === 'expected' ? ' stroke-dasharray="4 4"' : ' stroke-dasharray="2 4"';
        const opacity = t.s === 'open' ? .95 : t.s === 'expected' ? .8 : .45;
        return '<path d="' + t.d + '" fill="none" stroke="' + color + '" stroke-width="' + (active ? 4.5 : 3) + '" stroke-linecap="round"' + dash + ' opacity="' + (active ? 1 : opacity) + '"' + (active ? ' filter="drop-shadow(0 0 4px ' + color + ')"' : '') + '/>' +
          '<text x="' + t.lx + '" y="' + t.ly + '" font-size="7.5" fill="' + (active ? '#fff' : 'rgba(255,255,255,.78)') + '">' + t.label + '</text>';
      }).join('') +
      '<text x="28" y="198" font-size="7" fill="rgba(255,255,255,.35)">雪道示意图 · 非官方比例</text>' +
      '<text x="294" y="24" font-size="7" fill="rgba(255,255,255,.38)">山顶 2110m</text>' +
      '</svg>';
  }
  function snowContent() {
    const s = D.snow;
    return '<main class="screen with-tabs">' +
      pageHead('崇礼 · 红花梁', '更新于 ' + s.updatedAt) +
      '<div class="page-title">雪道开放</div>' +
      '<div class="page-sub">' + s.resort + ' · 官方公众号 ' + s.sourceTime + ' 更新</div>' +
      '<div class="snow-summary"><div class="snow-big"><div class="k">今日开放</div><div class="v">' + s.open + '<small>/ ' + s.total + ' 条</small></div><div class="s">预计明天 +' + s.expectedTomorrow + ' 条</div></div><div class="snow-side"><div class="line"><span>缆车</span><b>' + s.liftsOpen + ' / ' + s.liftsTotal + '</b></div><div class="line"><span>初级</span><b>5 条</b></div><div class="line"><span>中级</span><b>5 条</b></div><div class="line"><span>高级</span><b>2 条</b></div></div></div>' +
      '<div class="map-card"><div class="map-head"><div><div class="map-title">雪道开放示意图</div><div class="map-sub">实线=开放 · 虚线=预计 · 灰线=关闭</div></div><div class="map-toggle"><span class="on">全部</span><span>仅开放</span></div></div>' + trailMap() + '<div class="map-legend"><span><i style="background:#30D158"></i>初级</span><span><i style="background:#0A84FF"></i>中级</span><span><i style="background:#E8EDF2"></i>高级</span><span><i style="background:#FF9F0A"></i>双黑</span><span style="color:var(--ink4)">示意图 · 非官方雪道图</span></div></div>' +
      '<div class="timeline-card"><div class="timeline-head"><div class="timeline-title">开放时间轴</div><div class="timeline-sub">今天 → 未来 3 天</div></div><div class="timeline">' + s.timeline.slice(0, 4).map(t => '<div class="tl-item ' + (t.type === 'future' ? 'future' : t.type === 'closed' ? 'closed' : '') + '"><div class="tl-time">' + t.time + '</div><div class="tl-text">' + t.text + '</div><div class="tl-src">' + t.src + '</div></div>').join('') + '</div><div style="text-align:right;font-size:8.5px;color:var(--ink3);margin-top:2px">查看完整时间轴 ' + icon('chevron', 10) + '</div></div>' +
      '<div class="trail-list">' + s.trails.slice(0, 5).map(t => '<button class="trail-row" onclick="go(\'snow-detail\')"><span class="difficulty" style="background:' + diffColor(t.diff) + '"></span><span class="trail-name">' + t.name + '<span style="font-size:8px;color:var(--ink3);margin-left:4px">' + t.level + '</span></span><span class="trail-status ' + t.status + '">' + (t.status === 'open' ? '开放' : t.status === 'expected' ? '预计开放' : '关闭') + '</span><span class="trail-eta">' + t.eta + '</span></button>').join('') + '</div>' +
      '<div class="ghost-note">雪道状态来自雪场官方公众号/公告的手动整理；公众号没有公开 API，更新可能滞后。预计开放时间以雪场当日公告为准。</div>' +
      '<div class="source-line">来源：' + s.source + ' · ' + s.sourceTime + '<br>示意图为原创示意，不代表官方雪道图。</div>' +
      '</main>';
  }
  function snow() {
    return '<div class="app">' + bg('bg-snow') + statusbar() + snowContent() + tabbar('snow') + '</div>';
  }
  function snowDetail() {
    return '<div class="app">' + bg('bg-snow') + statusbar() + snowContent() + tabbar('snow') +
      '<div class="detail-scrim"></div><div class="detail-sheet" role="dialog" aria-modal="true" aria-label="雪道详情">' +
        '<div class="handle"></div><div class="detail-head"><div><div class="detail-title">玉龙道</div><div class="detail-sub">万龙滑雪场 · 高级道 · 山顶 2110m</div></div><button class="detail-close" onclick="go(\'snow\')">' + icon('close', 13) + '</button></div>' +
        '<span class="detail-pill" style="color:#FFB3AD;background:rgba(255,69,58,.13);border:1px solid rgba(255,69,58,.24)">关闭 · 造雪中</span>' +
        '<div class="detail-block"><h4>预计开放</h4><p><b>11/19 09:00</b>（官方预计，视造雪和天气）</p></div>' +
        '<div class="detail-block"><h4>最近更新</h4><p>11/18 16:40 · 万龙滑雪场公众号<br><span style="color:var(--ink4)">“玉龙道、银龙道造雪中，预计明日开放”</span></p></div>' +
        '<div class="small-map">' + trailMap('玉龙道') + '</div>' +
        '<div class="detail-block"><h4>状态时间轴</h4><div class="timeline mini"><div class="tl-item closed"><div class="tl-time">11/16 18:00</div><div class="tl-text">关闭 · 开始造雪</div></div><div class="tl-item"><div class="tl-time">11/18 16:40</div><div class="tl-text">官方公众号：造雪中，预计 11/19 开放</div></div><div class="tl-item future"><div class="tl-time">11/19 09:00</div><div class="tl-text">预计开放（待当日确认）</div></div></div></div>' +
        '<div class="detail-actions"><button>查看公众号原文</button><button class="primary">加入开放提醒</button></div>' +
        '<div class="detail-foot">雪道状态为公众号/公告手动整理，非官方实时 API；开放时间可能因天气、造雪、赛事调整。</div>' +
      '</div></div>';
  }

  function navBoard() {
    return '<div class="app"><div class="bg bg-night"></div>' + statusbar() +
      '<div class="nav-board"><h1>底部三模块导航</h1><p>iOS 风格悬浮气泡，天气内容保持原样。<br>右侧圆形按钮用于切换雪场/路线，不打断三个模块。</p>' +
      '<div class="nav-demo"><h3>默认 · 天气</h3>' + tabbar('weather') + '</div>' +
      '<div class="state-row"><span class="state-chip on">天气</span><span class="state-chip">路况</span><span class="state-chip">雪道</span></div>' +
      '<div class="nav-demo"><h3>选中 · 路况</h3>' + tabbar('road') + '</div>' +
      '<div class="nav-demo"><h3>选中 · 雪道</h3>' + tabbar('snow') + '</div>' +
      '<div class="ghost-note" style="margin-top:20px">导航高度 62px，距底部安全区 20px；内容区底部留白 144px。<br>天气页不改变任何内容，只增加导航和安全区。</div>' +
      '</div></div>';
  }

  const q = new URLSearchParams(location.search);
  const screen = q.get('screen') || 'weather';
  let html;
  if (screen === 'road') html = road();
  else if (screen === 'road-detail') html = roadDetail();
  else if (screen === 'snow') html = snow();
  else if (screen === 'snow-detail') html = snowDetail();
  else if (screen === 'nav') html = navBoard();
  else html = weather();
  document.getElementById('app').innerHTML = html;

  window.go = function (next, extra) {
    const u = new URL(location.href);
    u.searchParams.set('screen', next);
    if (extra) Object.keys(extra).forEach(k => u.searchParams.set(k, extra[k]));
    location.href = u.toString();
  };
})();
