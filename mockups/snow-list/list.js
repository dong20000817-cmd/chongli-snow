/* 雪道开放 · 分类列表效果图 */
(function () {
  'use strict';
  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    road: '<path d="M6 21 9 3M18 21 15 3M12 5v3M12 11v3M12 17v3"/>',
    trail: '<path d="M3 19h18L14 6l-3.5 6.5L8 9l-5 10Z"/><path d="m10.5 12.5 2-2 2 2"/>',
    pin: '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
  };
  function icon(name, size) {
    return '<svg class="icon" width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function statusbar() {
    return '<div class="statusbar"><span>20:17</span><span class="island"></span><span class="status-icons"><span class="sig"><i></i><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></span></div>';
  }
  function tabbar(active) {
    const tabs = [
      { id: 'weather', label: '天气', icon: 'sun' },
      { id: 'road', label: '路况', icon: 'road' },
      { id: 'snow', label: '雪道', icon: 'trail' }
    ];
    return '<nav class="tabbar" aria-label="模块切换">' + tabs.map(t => '<button class="tab ' + (active === t.id ? 'on' : '') + '" onclick="goTab(\'' + t.id + '\')">' + icon(t.icon, 19) + '<span>' + t.label + '</span></button>').join('') + '<span class="tab-sep"></span><button class="tab-ham" aria-label="切换雪场"><i></i><i></i><i></i></button></nav>';
  }

  const CATS = [
    {
      id: 'green', name: '绿道', sub: '初级', color: '#30D158', open: 5, total: 7,
      desc: '长龙、游龙、卧龙、小龙、魔毯区开放；雪面平整，适合新手和练习。',
      trails: [
        { name: '长龙道', len: '4.2 km', note: '全长最长 · 雪面平整' },
        { name: '游龙道', len: '2.1 km', note: '适合连续换刃' },
        { name: '卧龙道', len: '0.3 km', note: '魔毯区 · 新手友好' },
        { name: '小龙道', len: '1.2 km', note: '人少 · 坡度缓' },
        { name: '魔毯区', len: '0.2 km', note: '教学区' }
      ],
      closed: 2
    },
    {
      id: 'blue', name: '蓝道', sub: '中级', color: '#0A84FF', open: 4, total: 10,
      desc: '腾龙、中华龙、五彩、雪龙开放；银龙道因风大临时关闭，建议上午滑。',
      trails: [
        { name: '腾龙道', len: '1.8 km', note: '上午雪质最好' },
        { name: '中华龙道', len: '2.4 km', note: '宽度大 · 适合刻滑' },
        { name: '五彩龙道', len: '1.6 km', note: '坡度均匀' },
        { name: '雪龙道', len: '1.4 km', note: '下午风偏大' }
      ],
      closed: 6
    },
    {
      id: 'black', name: '黑道', sub: '高级', color: '#F2F5F7', open: 4, total: 12,
      desc: '威龙、玉龙、银龙、金龙开放；雪质偏硬，建议上午前往，注意控制速度。',
      trails: [
        { name: '威龙道', len: '1.5 km', note: '雪质偏硬' },
        { name: '玉龙道', len: '2.5 km', note: '下午风大' },
        { name: '银龙道', len: '2.0 km', note: '人流较多' },
        { name: '金龙道', len: '1.8 km', note: '局部有冰面' }
      ],
      closed: 8
    },
    {
      id: 'double', name: '双黑', sub: '专家', color: '#FF9F0A', open: 0, total: 3,
      desc: '大奔头、野雪 U 槽、树林野雪均未开放；预计 11/22 后视雪况和造雪进度。',
      trails: [
        { name: '大奔头', len: '1.2 km', status: 'expected', note: '预计 11/22' },
        { name: '野雪 U 槽', len: '0.8 km', status: 'closed', note: '待开放' },
        { name: '树林野雪', len: '2.0 km', status: 'closed', note: '待开放' }
      ],
      closed: 3
    }
  ];
  const Q = new URLSearchParams(location.search);
  const FILTER = Q.get('cat') || 'all';
  const FULL = Q.get('full') === '1';
  const OPEN = CATS.reduce((s, c) => s + c.open, 0);
  const TOTAL = 32;

  function trailRow(c, t) {
    const status = t.status || 'open';
    return '<div class="trail-row"><span class="trail-color" style="background:' + c.color + '"></span><div class="trail-main"><div class="trail-name">' + t.name + '</div><div class="trail-meta">' + t.len + ' · ' + t.note + '</div></div><span class="status ' + status + '">' + (status === 'open' ? '开放' : status === 'expected' ? '预计' : '关闭') + '</span></div>';
  }
  function section(c) {
    return '<section class="cat-section"><div class="cat-head"><div class="cat-title"><span class="dot" style="background:' + c.color + '"></span>' + c.name + '<small>' + c.sub + '</small></div><span class="cat-count" style="color:' + c.color + ';background:' + c.color + '1f;border:1px solid ' + c.color + '33">' + c.open + ' / ' + c.total + ' 开放</span></div><div class="cat-desc">' + c.desc + '</div><div class="trail-list">' + c.trails.map(t => trailRow(c, t)).join('') + '</div><div class="cat-foot"><span>' + (c.open === 0 ? '当前无开放雪道' : '以上为开放雪道') + '</span><span>另有 <b>' + (c.total - c.open) + '</b> 条关闭 · 查看全部 ' + icon('chevron', 9) + '</span></div></section>';
  }
  function content() {
    const visible = FILTER === 'all' ? CATS : CATS.filter(c => c.id === FILTER);
    return '<main class="screen with-tabs">' +
      '<div class="page-head"><span class="left">' + icon('pin', 11) + '崇礼 · 红花梁</span><span class="right">' + icon('refresh', 11) + '更新于 20:17</span></div>' +
      '<div class="page-title">雪道开放</div>' +
      '<div class="page-sub">万龙滑雪场 · 官方公众号 18:40 更新</div>' +
      '<div class="list-summary"><div class="top"><div><div class="k">今日开放</div><div class="big">' + OPEN + '<small>/ ' + TOTAL + ' 条</small></div></div><div class="summary-side"><b>缆车 4 / 7</b>今日新增 1 条<br>预计明天 +3</div></div><div class="desc">绿道和蓝道基本开放；黑道开放 4 条；双黑全部关闭。雪质整体偏硬，注意控速。</div><div class="meta">开放雪道 <b>' + OPEN + '</b> 条 · 关闭 <b>' + (TOTAL - OPEN) + '</b> 条 · 数据来自官方公众号</div></div>' +
      '<div class="filter-row"><button class="filter ' + (FILTER === 'all' ? 'on' : '') + '" onclick="goFilter(\'all\')">全部<b>' + OPEN + '/' + TOTAL + '</b></button>' + CATS.map(c => '<button class="filter ' + (FILTER === c.id ? 'on' : '') + '" onclick="goFilter(\'' + c.id + '\')"><span class="fd" style="background:' + c.color + '"></span>' + c.name + '<b>' + c.open + '/' + c.total + '</b></button>').join('') + '</div>' +
      visible.map(section).join('') +
      '<div class="future-card"><div class="future-head">未来 3 天预计 <span>以官方当日公告为准</span></div><div class="future-row"><div class="future-day"><small>明天 11/20</small><b>+3 条 <span>黑道 2 · 双黑 1</span></b></div><div class="future-day"><small>11/21</small><b>+2 条 <span>黑道</span></b></div><div class="future-day"><small>11/22</small><b>+1 条 <span>双黑</span></b></div></div></div>' +
      '<div class="source-line">状态来自雪场官方公众号/公告的人工整理，非官方实时 API；预计开放时间可能因天气、造雪、赛事调整。<br>公众号原文、雪道长度和难度以雪场发布为准。</div>' +
      '</main>';
  }
  const cls = FULL ? 'app full' : 'app';
  document.getElementById('app').innerHTML = '<div class="' + cls + '"><div class="bg bg-snow"></div>' + statusbar() + content() + tabbar('snow') + '</div>';

  window.goFilter = function (cat) {
    const u = new URL(location.href);
    u.searchParams.set('cat', cat);
    u.searchParams.delete('full');
    location.href = u.toString();
  };
  window.goTab = function (tab) {
    if (tab === 'snow') { location.href = 'index.html'; return; }
    location.href = '../modules/index.html?screen=' + tab;
  };
})();
