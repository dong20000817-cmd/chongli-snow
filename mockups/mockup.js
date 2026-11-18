/* 崇礼/金山岭雪况 · 可点击效果图（无依赖） */
(function () {
  'use strict';

  const DATA = window.MOCK_DATA;
  const RESORTS = Object.values(DATA.resorts);
  const TIERS = {
    great: { label: '非常建议', color: '#30D158', icon: 'ski',  rank: 3 },
    okay:  { label: '一般建议', color: '#0A84FF', icon: 'check', rank: 2 },
    poor:  { label: '不太建议', color: '#FF9F0A', icon: 'warning', rank: 1 },
    hell:  { label: '地狱难度', color: '#FF453A', icon: 'warning', rank: 0 },
  };
  const TIER_KEYS = ['hell', 'poor', 'okay', 'great'];
  const WD = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const WIND_NAMES = ['无风','软风','轻风','微风','和风','清风','强风','疾风','大风','烈风','狂风','暴风','飓风'];

  // ---------- icons ----------
  const ICONS = {
    pin: '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.4 14.4A8.5 8.5 0 0 1 9.6 3.6 8.6 8.6 0 1 0 20.4 14.4Z"/>',
    cloud: '<path d="M6.2 18h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 9.3 4.4 4.4 0 0 0 6.2 18Z"/>',
    partly: '<circle cx="8" cy="8" r="3.2"/><path d="M8 2.4v1.4M2.4 8h1.4M4 4l1 1M12.6 4l-1 1M4 12l1-1"/><path d="M9.5 19h9a3 3 0 0 0 .3-6 4.6 4.6 0 0 0-8.5-1.4A3.6 3.6 0 0 0 9.5 19Z"/>',
    snow: '<path d="M6.2 16.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 7.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M8 19.5v1M12 19.5v1M16 19.5v1M9.5 20.5l-1-.6M14.5 20.5l1-.6M9.5 22l-1 .6M14.5 22l1 .6"/>',
    fog: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M5 19h14M8 22h8"/>',
    rain: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2"/>',
    storm: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="m12 17-2 4h3l-1 3 4-5h-3l1.5-2Z"/>',
    wind: '<path d="M3 8h11.5a2.5 2.5 0 1 0-2.4-3.2M3 12h15.5a2.5 2.5 0 1 1-2.4 3.2M3 16h8.5a2.2 2.2 0 1 1-2.1 2.8"/>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v6.5"/>',
    mountain: '<path d="M3 19h18L14 6l-3.5 6.5L8 9l-5 10Z"/><path d="m10.5 12.5 2-2 2 2"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5.3-5.3 2.2 2.2-5.3 5.3-2.2Z"/>',
    gauge: '<path d="M4.2 17a8.5 8.5 0 1 1 15.6 0"/><path d="m12 13 3.2-3.2"/><circle cx="12" cy="14" r="1.4"/>',
    snowflake: '<path d="M12 2v20M4 6l16 12M20 6 4 18M8 4l4 4 4-4M8 20l4-4 4 4M2 10l4 2-4 2M22 10l-4 2 4 2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    warning: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.2v.2"/>',
    ski: '<path d="M4 19.5 20 17M7 16.5l2.2-6.5 3.2 2 2.4-4 1.4 5.4"/><circle cx="9" cy="6" r="1.8"/><path d="M13 12.5l-3 4M6 21l2-2M18 20l-1-1"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.2"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    arrowUp: '<path d="M12 20V4M6 10l6-6 6 6"/>',
    cable: '<path d="M3 5.5h18M6 5.5 8.5 19M18 5.5 15.5 19M7.2 12h9.6M8 19h8"/><path d="M10 5.5V9h4V5.5"/>',
  };
  function svg(name, size, cls) {
    size = size || 16;
    return '<svg class="icon ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function weatherIcon(code, isDay, size, cls) {
    code = Number(code) || 0;
    let n = 'cloud';
    if (code === 0) n = isDay ? 'sun' : 'moon';
    else if (code === 1) n = isDay ? 'partly' : 'moon';
    else if (code === 2) n = 'partly';
    else if (code === 3) n = 'cloud';
    else if (code === 45 || code === 48) n = 'fog';
    else if (code >= 51 && code <= 67) n = 'rain';
    else if (code >= 71 && code <= 77) n = 'snow';
    else if (code >= 80 && code <= 82) n = 'rain';
    else if (code >= 85 && code <= 86) n = 'snow';
    else if (code >= 95) n = 'storm';
    return svg(n, size || 24, cls || '');
  }

  // ---------- format / data ----------
  const pad = n => String(n).padStart(2, '0');
  const round = n => Math.round(Number(n));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function temp(n) { return (n == null || !isFinite(n)) ? '—' : (round(n) > 0 ? '+' + round(n) : String(round(n))); }
  function tempShort(n) { return (n == null || !isFinite(n)) ? '—' : round(n) + '°'; }
  function fmtVis(m) {
    if (m == null || !isFinite(m)) return '—';
    if (m >= 10000) return '>10 km';
    if (m >= 1000) return (m / 1000).toFixed(1) + ' km';
    return Math.round(m) + ' m';
  }
  function fmtTime(t) { return t.slice(11, 16); }
  function fmtDate(t) { return t.slice(5, 10).replace('-', '/'); }
  function hourOf(t) { return Number(t.slice(11, 13)); }
  function minuteOf(t) { return Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16)); }
  function windLevel(kmh) {
    const v = Number(kmh);
    if (!isFinite(v)) return 0;
    const th = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
    for (let i = 0; i < th.length; i++) if (v < th[i]) return i;
    return 12;
  }
  function windName(level) { return WIND_NAMES[clamp(level, 0, 12)] || ''; }
  function dirText(deg) {
    if (deg == null || !isFinite(deg)) return '—';
    return WD[Math.round(Number(deg) / 45) % 8] + '风';
  }
  function dirShort(deg) {
    return WD[Math.round(Number(deg) / 45) % 8] || '—';
  }
  function weatherText(code) {
    code = Number(code) || 0;
    if (code === 0) return '晴';
    if (code === 1) return '晴间多云';
    if (code === 2) return '多云';
    if (code === 3) return '阴';
    if (code === 45 || code === 48) return '雾';
    if (code >= 51 && code <= 57) return '毛毛雨';
    if (code >= 61 && code <= 67) return '雨';
    if (code === 71) return '小雪';
    if (code === 73) return '中雪';
    if (code === 75) return '大雪';
    if (code === 77) return '米雪';
    if (code === 80 || code === 81) return '阵雨';
    if (code === 82) return '强阵雨';
    if (code === 85) return '阵雪';
    if (code === 86) return '强阵雪';
    if (code >= 95) return '雷暴';
    return '多云';
  }
  function dayTierRank(t) { return TIERS[t] ? TIERS[t].rank : 2; }
  function tierColor(t) { return TIERS[t] ? TIERS[t].color : '#0A84FF'; }
  function tierLabel(t) { return TIERS[t] ? TIERS[t].label : '一般建议'; }
  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function nowTime() {
    const s = DATA.generatedAt || '2026-11-18T09:54:00';
    return s.slice(11, 16);
  }
  function statusTime() {
    return nowTime().replace(/^0/, '');
  }
  function currentResort() {
    const q = new URLSearchParams(location.search);
    const id = q.get('resort') || 'wanlong';
    return DATA.resorts[id] || DATA.resorts.wanlong || RESORTS[0];
  }
  function datesOf(r) {
    return Array.from(new Set(r.hourly.map(h => h.time.slice(0, 10))));
  }
  function currentIndex(r) {
    const hh = Number(nowTime().slice(0, 2));
    const key = DATA.today + 'T' + pad(hh) + ':00';
    const i = r.hourly.findIndex(x => x.time === key);
    return i >= 0 ? i : 0;
  }
  function currentHour(r) { return r.hourly[currentIndex(r)]; }
  function hoursFor(r, date) { return r.hourly.filter(h => h.time.startsWith(date)); }

  // ---------- recommendation ----------
  function hourTier(h) {
    const p = h.peak || h.base;
    const v = p.vis == null ? 99999 : Number(p.vis);
    const w = Number(p.wind) || 0;
    const g = p.gust == null ? w * 1.5 : Number(p.gust);
    const f = p.feels == null ? Number(p.temp) : Number(p.feels);
    const s = Number(p.snow) || 0;
    const c = Number(p.code) || 0;
    if (v < 500 || w >= 50 || g >= 75 || f < -30 || c >= 95 || [56, 57, 66, 67].includes(c)) return 'hell';
    if (v < 2000 || w >= 39 || g >= 60 || f < -26) return 'poor';
    if (v >= 5000 && w <= 28 && g < 45 && f >= -20 && s <= 2 && ![45, 48, 95, 96, 97, 98, 99].includes(c)) return 'great';
    return 'okay';
  }
  function dailyFor(r, date) {
    const day = hoursFor(r, date).filter(h => hourOf(h.time) >= 8 && hourOf(h.time) <= 16);
    const list = day.length ? day : hoursFor(r, date);
    const counts = { great: 0, okay: 0, poor: 0, hell: 0 };
    list.forEach(h => { counts[hourTier(h)]++; });
    let tier;
    if (counts.hell >= 2) tier = 'hell';
    else if ((counts.poor || 0) + (counts.hell || 0) >= 3) tier = 'poor';
    else if (counts.great >= 5 && !((counts.poor || 0) + (counts.hell || 0))) tier = 'great';
    else tier = 'okay';
    const worst = list.slice().sort((a, b) => {
      const d = dayTierRank(hourTier(a)) - dayTierRank(hourTier(b));
      if (d) return d;
      return (b.peak.gust || 0) - (a.peak.gust || 0);
    })[0] || list[0] || r.hourly[0];
    const best = list.slice().sort((a, b) => {
      const d = dayTierRank(hourTier(b)) - dayTierRank(hourTier(a));
      if (d) return d;
      return (a.peak.gust || 0) - (b.peak.gust || 0);
    })[0] || worst;
    const baseT = list.map(h => h.base.temp).filter(v => v != null);
    const highs = baseT.length ? Math.max(...baseT) : null;
    const lows = baseT.length ? Math.min(...baseT) : null;
    const maxWind = Math.max(...list.map(h => windLevel(h.peak.wind)));
    const minVis = Math.min(...list.map(h => h.peak.vis == null ? 99999 : h.peak.vis));
    const snow = list.reduce((a, h) => a + (Number(h.peak.snow) || 0), 0);
    return { date, tier, counts, worst, best, high: highs, low: lows, maxWind, minVis, snow, list };
  }
  function riskOf(h) {
    const w = Number(h.peak.wind) || 0;
    const g = Number(h.peak.gust) || 0;
    if (w >= 50 || g >= 75) return { key: 'stop', label: '可能停运', color: '#FF453A', score: 0 };
    if (w >= 39 || g >= 60) return { key: 'slow', label: '可能降速', color: '#FF9F0A', score: 45 };
    return { key: 'ok', label: '正常', color: '#30D158', score: 100 };
  }
  function windScore(level) { return [100, 100, 96, 90, 80, 65, 40, 20, 5, 0, 0, 0, 0][clamp(level, 0, 12)]; }
  function visScore(v) {
    if (v == null || !isFinite(v)) return 60;
    if (v >= 10000) return 100;
    if (v >= 5000) return 90;
    if (v >= 3000) return 75;
    if (v >= 2000) return 60;
    if (v >= 1000) return 35;
    if (v >= 500) return 15;
    return 0;
  }
  function feelScore(f) {
    if (f == null || !isFinite(f)) return 50;
    if (f >= -15) return 100;
    if (f >= -20) return 90;
    if (f >= -25) return 65;
    if (f >= -28) return 40;
    if (f >= -30) return 15;
    return 0;
  }
  function overallScore(h) {
    const w = windScore(windLevel(h.peak.wind));
    const v = visScore(h.peak.vis);
    const f = feelScore(h.peak.feels);
    const l = riskOf(h).score;
    const raw = Math.round(w * .40 + v * .25 + f * .20 + l * .15);
    // 安全闸门：分数不能和等级打架（地狱难度不可能 64 分）
    const cap = { hell: 24, poor: 54, okay: 84, great: 100 }[hourTier(h)];
    return Math.min(raw, cap);
  }
  function reasonFor(tier, worst) {
    const w = worst.peak;
    const wl = windLevel(w.wind), gl = windLevel(w.gust);
    const parts = [];
    if (tier === 'hell') {
      if (w.gust >= 75) parts.push('山顶阵风 ' + gl + ' 级（' + round(w.gust) + ' km/h），缆车可能停运');
      else if (w.wind >= 50) parts.push('山顶持续风 ' + wl + ' 级，缆车可能停运');
      if (w.vis != null && w.vis < 500) parts.push('能见度仅 ' + fmtVis(w.vis));
      if (w.feels != null && w.feels < -30) parts.push('山顶体感 ' + round(w.feels) + '°');
      if (!parts.length) parts.push('风力/能见度达到危险级别');
    } else if (tier === 'poor') {
      if (w.gust >= 60) parts.push('山顶阵风 ' + gl + ' 级，缆车可能降速');
      if (w.vis != null && w.vis < 2000) parts.push('能见度 ' + fmtVis(w.vis) + '，雪道边界辨识困难');
      if (w.feels != null && w.feels < -26) parts.push('山顶体感 ' + round(w.feels) + '°，注意冻伤');
      if (!parts.length) parts.push('风偏大或能见度偏低');
    } else if (tier === 'okay') {
      if (w.wind >= 29 || w.gust >= 45) parts.push('山顶风 ' + wl + ' 级（' + round(w.wind) + ' km/h），风略大但缆车预计正常');
      else if (w.vis != null && w.vis < 5000) parts.push('能见度 ' + fmtVis(w.vis) + '，部分雪道视野一般');
      else parts.push('天气整体可滑，注意保暖');
    } else {
      parts.push('能见度 ' + fmtVis(w.vis) + '，山顶风 ' + wl + ' 级，体感 ' + round(w.feels) + '°');
    }
    return parts.slice(0, 2).join('；');
  }
  function shortReason(tier, daily) {
    const w = daily.worst.peak;
    if (tier === 'hell') {
      if (w.gust >= 75) return '阵风 ' + windLevel(w.gust) + ' 级，缆车可能停运';
      if (w.vis != null && w.vis < 500) return '能见度 ' + fmtVis(w.vis);
      if (w.feels != null && w.feels < -30) return '体感 ' + round(w.feels) + '°';
      return '风力达到危险级别';
    }
    if (tier === 'poor') {
      if (w.gust >= 60) return '阵风 ' + windLevel(w.gust) + ' 级，缆车可能降速';
      if (w.vis != null && w.vis < 2000) return '能见度 ' + fmtVis(w.vis);
      return '体感 ' + round(w.feels) + '°，注意保暖';
    }
    if (tier === 'okay') {
      if (w.vis != null && w.vis < 2000) return '短时能见度 ' + fmtVis(w.vis) + '，其余时段可滑';
      if (w.wind >= 29) return '山顶风 ' + windLevel(w.wind) + ' 级，缆车预计正常';
      if (w.feels != null && w.feels < -26) return '短时体感 ' + round(w.feels) + '°，其余时段可滑';
      return '能见度 ' + fmtVis(w.vis) + '，整体可滑';
    }
    const b = daily.best.peak;
    return '能见度 ' + fmtVis(b.vis) + '，风 ' + windLevel(b.wind) + ' 级';
  }
  function dayLabel(date, idx) {
    if (idx === 0) return '今天';
    if (idx === 1) return '明天';
    const d = new Date(date + 'T12:00:00+08:00');
    return '周' + '日一二三四五六'[d.getDay()];
  }
  function daySub(date, idx) {
    return fmtDate(date);
  }
  function betterWindow(r, daily, idx) {
    const dates = datesOf(r);
    const nowMin = minuteOf(DATA.today + 'T' + nowTime() + ':00');
    for (let di = idx; di < Math.min(dates.length, idx + 2); di++) {
      const d = dailyFor(r, dates[di]);
      const windows = [];
      for (let i = 0; i < d.list.length - 1; i++) {
        const a = d.list[i], b = d.list[i + 1];
        const ah = hourOf(a.time), bh = hourOf(b.time);
        if (ah < 8 || bh > 16) continue;
        if (di === 0 && ah * 60 < nowMin) continue;
        // 两小时里取更差的一档，避免把“1 小时好、1 小时坏”说成好转
        const ta = hourTier(a), tb = hourTier(b);
        const t = dayTierRank(ta) <= dayTierRank(tb) ? ta : tb;
        if (dayTierRank(t) > dayTierRank(daily.tier)) windows.push({ t, a, b, d });
      }
      if (windows.length) {
        const w = windows[0];
        const when = di === 0 ? '今天' : di === 1 ? '明天' : dayLabel(dates[di], di);
        return when + ' ' + fmtTime(w.a.time) + '–' + fmtTime(w.b.time) + ' 阵风降至 ' + windLevel(w.b.peak.gust) + ' 级，' + tierLabel(w.t);
      }
    }
    return '未来 24 小时无明显好转窗口，建议改期或换雪场';
  }

  // ---------- background ----------
  function bgClass(h) {
    if (!h.peak.isDay) return 'bg-night';
    const c = Number(h.peak.code) || 0;
    if ([71, 73, 75, 77, 85, 86].includes(c)) return 'bg-snow';
    if ([45, 48].includes(c)) return 'bg-fog';
    if (c <= 1) return 'bg-clear';
    return 'bg-cloud';
  }
  function bg(h) { return '<div class="bg ' + bgClass(h) + '"></div>'; }
  function statusBar() {
    return '<div class="statusbar"><span>' + statusTime() + '</span><span class="island"></span><span class="status-icons"><span class="sig"><i></i><i></i><i></i><i></i></span><span class="wifi"></span><span class="battery"></span></span></div>';
  }
  function homeIndicator() { return '<div class="home-indicator"></div>'; }
  function fab() { return '<button class="fab" aria-label="切换雪场" onclick="go(\'switch\')"><i></i><i></i><i></i></button>'; }

  // ---------- wind chart ----------
  function levelColor(level) {
    if (level >= 8) return '#FF453A';
    if (level >= 6) return '#FF9F0A';
    if (level >= 4) return '#FFD60A';
    return '#30D158';
  }
  function windChart(r, startIndex, count, opts) {
    opts = opts || {};
    const start = clamp(startIndex, 0, Math.max(0, r.hourly.length - 1));
    const hours = r.hourly.slice(start, start + count);
    if (!hours.length) return '';
    const W = 360, H = 222;
    const L = 27, R = 7, T = 18, B = 25;
    const PW = W - L - R, PH = H - T - B;
    const maxLevel = 10;
    const x = i => L + (i + 0.5) * (PW / hours.length);
    const y = lvl => T + PH - (clamp(lvl, 0, maxLevel) / maxLevel) * PH;
    const barW = Math.max(2.4, Math.min(10, (PW / hours.length) * 0.54));
    const cur = currentIndex(r) - start;
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + r.short + '未来 ' + hours.length + ' 小时风力图">';
    s += '<defs><linearGradient id="gustFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient></defs>';
    // day shading
    for (let i = 0; i < hours.length; i++) {
      const hh = hourOf(hours[i].time);
      if (hh >= 8 && hh <= 16) {
        s += '<rect x="' + (x(i) - PW / hours.length / 2) + '" y="' + T + '" width="' + (PW / hours.length) + '" height="' + PH + '" fill="rgba(255,255,255,.035)"/>';
      }
    }
    // danger bands
    s += '<rect x="' + L + '" y="' + y(10) + '" width="' + PW + '" height="' + (y(8) - y(10)) + '" fill="rgba(255,69,58,.10)"/>';
    s += '<rect x="' + L + '" y="' + y(8) + '" width="' + PW + '" height="' + (y(6) - y(8)) + '" fill="rgba(255,159,10,.075)"/>';
    s += '<rect x="' + L + '" y="' + y(6) + '" width="' + PW + '" height="' + (y(4) - y(6)) + '" fill="rgba(255,214,10,.045)"/>';
    // grid
    [0, 2, 4, 6, 8, 10].forEach(lvl => {
      s += '<line x1="' + L + '" y1="' + y(lvl) + '" x2="' + (W - R) + '" y2="' + y(lvl) + '" stroke="rgba(255,255,255,' + (lvl === 0 ? .18 : .09) + ')" stroke-width="1"/>';
      s += '<text x="' + (L - 6) + '" y="' + (y(lvl) + 3) + '" text-anchor="end" font-size="8" fill="rgba(255,255,255,.46)">' + lvl + '</text>';
    });
    // thresholds
    [[6, '缆车降速'], [8, '可能停运']].forEach(([lvl, label]) => {
      s += '<line x1="' + L + '" y1="' + y(lvl) + '" x2="' + (W - R) + '" y2="' + y(lvl) + '" stroke="' + (lvl === 6 ? 'rgba(255,159,10,.7)' : 'rgba(255,69,58,.8)') + '" stroke-width="1" stroke-dasharray="3 3"/>';
      s += '<text x="' + (W - R - 1) + '" y="' + (y(lvl) - 3) + '" text-anchor="end" font-size="7.2" fill="' + (lvl === 6 ? '#FFD8A8' : '#FFB3AD') + '">' + lvl + '级 ' + label + '</text>';
    });
    // bars
    hours.forEach((h, i) => {
      const lvl = windLevel(h.peak.wind);
      const yy = y(lvl);
      const hh = Math.max(2, y(0) - yy);
      s += '<rect x="' + (x(i) - barW / 2) + '" y="' + yy + '" width="' + barW + '" height="' + hh + '" rx="' + Math.min(3, barW / 2) + '" fill="' + levelColor(lvl) + '" opacity="' + (lvl >= 6 ? .95 : .78) + '"/>';
    });
    // gust line
    const gp = hours.map((h, i) => x(i) + ',' + y(windLevel(h.peak.gust))).join(' ');
    s += '<polyline points="' + gp + '" fill="none" stroke="url(#gustFade)" stroke-width="1.8" stroke-dasharray="3 3" stroke-linecap="round" stroke-linejoin="round"/>';
    // direction arrows
    const step = opts.labelsEvery || (hours.length > 30 ? 6 : 3);
    hours.forEach((h, i) => {
      if (i % step !== 0) return;
      const deg = Number(h.peak.dir) || 0;
      s += '<text x="' + x(i) + '" y="11" text-anchor="middle" font-size="9" fill="rgba(255,255,255,.55)" transform="rotate(' + (deg + 180) + ' ' + x(i) + ' 8)">↑</text>';
    });
    // current line
    if (cur >= 0 && cur < hours.length) {
      const cx = x(cur);
      s += '<line x1="' + cx + '" y1="' + (T - 1) + '" x2="' + cx + '" y2="' + (T + PH) + '" stroke="rgba(255,255,255,.55)" stroke-width="1" stroke-dasharray="2 3"/>';
      s += '<circle cx="' + cx + '" cy="' + y(windLevel(hours[cur].peak.wind)) + '" r="2.9" fill="#fff" stroke="#0B1725" stroke-width="1.5"/>';
      s += '<rect x="' + (cx - 13) + '" y="' + (T + PH - 1) + '" width="26" height="10" rx="3" fill="rgba(0,0,0,.28)"/>';
      s += '<text x="' + cx + '" y="' + (T + PH + 7) + '" text-anchor="middle" font-size="7" fill="rgba(255,255,255,.82)">现在</text>';
    }
    // x labels
    hours.forEach((h, i) => {
      if (i % step !== 0) return;
      s += '<text x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.48)">' + fmtTime(h.time) + '</text>';
    });
    s += '</svg>';
    return s;
  }

  // ---------- small components ----------
  function metricCard(label, value, sub, iconName) {
    return '<div class="metric"><div class="metric-label">' + svg(iconName || 'info', 12) + label + '</div><div class="metric-value">' + value + '</div><div class="metric-sub">' + sub + '</div></div>';
  }
  function hourlyStrip(r, n) {
    const ci = currentIndex(r);
    const hours = r.hourly.slice(ci, ci + n);
    return '<div class="hourly-wrap"><div class="hourly">' + hours.map((h, i) => {
      const lvl = windLevel(h.peak.wind);
      const col = levelColor(lvl);
      return '<div class="hour"><div class="ht">' + (i === 0 ? '现在' : fmtTime(h.time)) + '</div>' + weatherIcon(h.base.code, h.base.isDay, 21) + '<div class="htemp">' + tempShort(h.base.temp) + '</div><div class="hwind" style="color:' + col + ';background:' + rgba(col, .13) + '">' + lvl + '级</div></div>';
    }).join('') + '</div></div>';
  }
  function weekRow(r, d, idx, compact) {
    const t = TIERS[d.tier];
    const col = t.color;
    return '<div class="week-row" onclick="go(\'why\',{day:' + idx + '})">' +
      '<div class="week-day">' + dayLabel(d.date, idx) + '<small>' + daySub(d.date, idx) + '</small></div>' +
      weatherIcon(d.worst.base.code, d.worst.base.isDay, 23, 'week-ico') +
      '<div class="week-main"><span class="pill" style="color:' + col + ';background:' + rgba(col, .15) + ';border:1px solid ' + rgba(col, .26) + '">' + t.label + '</span><div class="week-reason">' + shortReason(d.tier, d) + '</div></div>' +
      '<div class="week-temp">' + tempShort(d.high) + '<small>' + tempShort(d.low) + '</small></div>' +
      (compact ? '' : svg('chevron', 13, 'week-chev')) +
      '</div>';
  }
  function navBack(title) {
    return '<div class="nav"><button class="nav-back" onclick="go(\'home\')" aria-label="返回">' + svg('back', 16) + '</button><div class="nav-title">' + title + '</div><div class="nav-space"></div></div>';
  }
  function closeBtn() {
    return '<button class="sheet-close" onclick="go(\'home\')" aria-label="关闭">' + svg('close', 13) + '</button>';
  }

  // ---------- home ----------
  function homeScreen(r, opts) {
    opts = opts || {};
    const d = dailyFor(r, DATA.today);
    const cur = currentHour(r);
    const p = cur.peak, b = cur.base;
    const t = TIERS[d.tier];
    const tcol = t.color;
    const ci = currentIndex(r);
    const snow24 = r.hourly.slice(ci, ci + 24).reduce((a, h) => a + (Number(h.peak.snow) || 0), 0);
    const windNow = windLevel(p.wind);
    const gustNow = windLevel(p.gust);
    const risk = riskOf(d.worst);
    const isFull = !!opts.full;
    const startChart = Math.max(0, r.hourly.findIndex(h => h.time === DATA.today + 'T06:00'));
    const chartStart = startChart >= 0 ? startChart : 0;
    return '<main class="screen home">' +
      '<div class="topline"><span class="region">' + svg('pin', 11) + r.region + ' · ' + r.area.split(' · ')[0] + '</span><span class="updated">' + svg('refresh', 12) + '更新于 ' + nowTime() + '</span></div>' +
      '<h1 class="resort-title">' + r.name + '</h1>' +
      '<div class="resort-sub">山顶 ' + r.peakElev + 'm · 山底 ' + r.baseElev + 'm' + (r.region === '承德' ? ' · 承德滦平' : '') + '</div>' +
      '<div class="hero"><div class="hero-temp">' + temp(b.temp) + '<span class="deg">°</span></div><div class="hero-right">' + weatherIcon(b.code, b.isDay, 66, 'hero-icon') + '<div class="condition">' + weatherText(b.code) + '</div><div class="hero-range">日间 ' + tempShort(d.high) + ' / ' + tempShort(d.low) + '</div><div class="feels">体感 <b>' + tempShort(p.feels) + '</b> · 山顶</div></div></div>' +
      '<div class="verdict tier-' + d.tier + '" style="background:linear-gradient(135deg,' + rgba(tcol, .40) + ',' + rgba(tcol, .10) + '),rgba(15,23,34,.72);border-color:' + rgba(tcol, .44) + ';color:' + tcol + '">' +
        '<div class="verdict-top"><div class="verdict-glyph">' + svg(t.icon, 20) + '</div><div><div class="verdict-label">' + t.label + '</div><div class="verdict-window">今天 08:00–17:00 · 最差 ' + fmtTime(d.worst.time) + '</div></div><div style="margin-left:auto;text-align:right;font-size:9.5px;color:rgba(255,255,255,.62);line-height:1.5">现在<br><b style="color:#fff;font-size:12px">' + windNow + '级 · 阵风' + gustNow + '级</b></div></div>' +
        '<div class="verdict-reason">' + reasonFor(d.tier, d.worst) + '</div>' +
        '<div class="verdict-foot"><span>' + (d.tier === 'hell' ? '安全优先，建议改期或改雪场' : d.tier === 'poor' ? '如要上山，避开最差时段' : d.tier === 'okay' ? '可滑，注意防风保暖' : '今天适合上山') + '</span><span class="verdict-link" onclick="go(\'why\')">查看依据 ' + svg('chevron', 11) + '</span></div>' +
      '</div>' +
      '<div class="metrics">' +
        metricCard('雪场天气', weatherText(b.code), '未来24h降雪 ' + (snow24 ? snow24.toFixed(1) : '0') + ' cm', 'cloud') +
        metricCard('能见度', fmtVis(p.vis), '山顶 · ' + (p.vis != null && p.vis >= 10000 ? '通透' : p.vis < 2000 ? '偏低' : '尚可'), 'eye') +
        metricCard('山顶温度', tempShort(p.temp), r.peakElev + 'm', 'thermo') +
        metricCard('山底温度', tempShort(b.temp), r.baseElev + 'm', 'thermo') +
        metricCard('体感温度', tempShort(p.feels), '山顶风冷', 'thermo') +
        metricCard('风向', dirText(p.dir), round(p.dir) + '° · 山顶', 'compass') +
        metricCard('风速', round(p.wind) + '<small> km/h</small>', '阵风 ' + round(p.gust) + ' km/h', 'wind') +
        metricCard('风级', windNow + '<small>级</small>', '阵风 ' + gustNow + '级 · ' + windName(windNow), 'gauge') +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><div><div class="card-title">风力 · 未来24小时</div><div class="card-sub">山顶 10m 风速 · 虚线为阵风</div></div><div class="wind-alert" style="color:' + (risk.key === 'stop' ? '#FFB3AD' : '#FFD8A8') + ';background:' + rgba(risk.color, .14) + ';border-color:' + rgba(risk.color, .28) + '">' + risk.label + '</div></div>' +
        '<div class="wind-now"><div class="wind-big">' + windNow + '<small>级</small></div><div class="wind-meta"><b>' + round(p.wind) + ' km/h</b> ' + dirText(p.dir) + '<br>阵风 ' + round(p.gust) + ' km/h · ' + gustNow + '级</div></div>' +
        '<div class="chart-wrap">' + windChart(r, chartStart, 24) + '</div>' +
        '<div class="legend"><span><i style="background:#FF9F0A"></i>持续风</span><span><i class="dash"></i>阵风</span><span><i class="band"></i>缆车风险区</span></div>' +
      '</div>' +
      '<div class="section-title"><h2>逐小时</h2><span style="font-size:9.5px;color:var(--ink3)">山顶风级</span></div>' +
      hourlyStrip(r, 12) +
      '<div class="section-title"><h2>未来 7 天</h2><a onclick="go(\'week\')">查看全部 ' + svg('chevron', 11) + '</a></div>' +
      '<div class="week-list">' + [0, 1, 2].map(i => weekRow(r, dailyFor(r, datesOf(r)[i]), i, true)).join('') + '</div>' +
      '<div class="source-line">天气数据：Open-Meteo（CC BY 4.0）· 预报非实况<br>缆车风险为天气估算，以雪场公告为准。' + (isFull ? '' : '') + '</div>' +
      (isFull ? '<div style="height:16px"></div>' : '') +
    '</main>';
  }
  function renderHome(full) {
    const r = currentResort();
    return '<div class="app' + (full ? ' full' : '') + '">' + bg(currentHour(r)) + statusBar() + homeScreen(r, { full: full }) + (full ? '' : fab()) + homeIndicator() + '</div>';
  }

  // ---------- wind detail ----------
  function renderWind() {
    const r = currentResort();
    const cur = currentHour(r);
    const ci = currentIndex(r);
    const p = cur.peak;
    const wl = windLevel(p.wind), gl = windLevel(p.gust);
    const risk = riskOf(cur);
    const q = new URLSearchParams(location.search);
    const span = Number(q.get('span') || 48);
    const nowH = Number(nowTime().slice(0, 2));
    const next = r.hourly.slice(ci, ci + 12);
    const stop = next.find(h => hourOf(h.time) > nowH && riskOf(h).key === 'stop');
    const slow = next.find(h => hourOf(h.time) > nowH && riskOf(h).key === 'slow');
    const riskNow = risk.label;
    const table = r.hourly.slice(ci, ci + 6).map(h => {
      const lvl = windLevel(h.peak.wind);
      return '<div class="ht-row"><b>' + fmtTime(h.time) + '</b><span>' + round(h.peak.wind) + ' km/h</span><span>' + round(h.peak.gust) + ' km/h</span><span class="lvl" style="color:' + levelColor(lvl) + '">' + lvl + '级</span></div>';
    }).join('');
    return '<div class="app">' + bg(cur) + statusBar() +
      '<main class="screen wind">' +
        navBack('风力详情') +
        '<div class="wind-title">' + r.short + ' · 山顶风力</div>' +
        '<div class="wind-sub">' + r.name + ' · 海拔 ' + r.peakElev + 'm · 更新于 ' + nowTime() + '</div>' +
        '<div class="wind-hero"><div class="wl">' + wl + '<small>级</small></div><div class="wind-hero-right"><b>' + round(p.wind) + ' km/h ' + dirText(p.dir) + '</b><br>阵风 ' + round(p.gust) + ' km/h · ' + gl + '级<div class="risk-pill" style="color:' + risk.color + ';background:' + rgba(risk.color, .14) + ';border:1px solid ' + rgba(risk.color, .28) + '">' + risk.label + '</div></div></div>' +
        '<div class="segmented"><button class="' + (span === 24 ? 'on' : '') + '" onclick="go(\'wind\',{span:24})">24小时</button><button class="' + (span === 48 ? 'on' : '') + '" onclick="go(\'wind\',{span:48})">48小时</button><button class="' + (span === 72 ? 'on' : '') + '" onclick="go(\'wind\',{span:72})">72小时</button></div>' +
        '<div class="card chart-card"><div class="card-head"><div><div class="card-title">未来 ' + span + ' 小时风力</div><div class="card-sub">柱=持续风 · 虚线=阵风 · 箭头=风向</div></div><div class="win-alert" style="font-size:9px;color:var(--ink3)">单位 km/h</div></div><div class="chart-wrap">' + windChart(r, ci, span, { labelsEvery: span > 30 ? 6 : 3 }) + '</div><div class="legend"><span><i style="background:#FF9F0A"></i>持续风</span><span><i class="dash"></i>阵风</span><span><i class="band"></i>6–8级风险</span></div></div>' +
        '<div class="risk-card"><div class="risk-head"><div class="risk-title">缆车风险时间线</div><div class="risk-state" style="color:' + (risk.key === 'stop' ? '#FFB3AD' : '#FFD8A8') + '">现在' + riskNow + '</div></div>' +
          '<div class="risk-track"><i style="width:38%;background:#30D158"></i><i style="width:37%;background:#FF9F0A"></i><i style="width:25%;background:#FF453A"></i></div>' +
          '<div class="risk-times"><span>现在</span><span>' + (slow ? fmtTime(slow.time) : '—') + ' 降速</span><span>' + (stop ? fmtTime(stop.time) : '—') + ' 停运</span></div>' +
          '<div class="risk-note">按持续风 ≥39 / 阵风 ≥60 估算降速，持续风 ≥50 / 阵风 ≥75 估算停运。' + (stop ? '今天 ' + fmtTime(stop.time) + ' 后阵风达到停运阈值。' : '') + '非雪场官方公告。</div>' +
        '</div>' +
        '<div class="hour-table"><div class="ht-head"><span>时间</span><span>持续风</span><span>阵风</span><span>风级</span></div>' + table + '</div>' +
        '<a class="windy-link" href="https://www.windy.com/' + r.lat + '/' + r.lon + '?wind,' + r.lat + ',' + r.lon + ',10" target="_blank" rel="noopener">在 Windy 查看风场动画 ' + svg('external', 12) + '</a>' +
        '<div class="source-line">风力为 10m 模式风，山脊实际风可能更大。<br>数据：Open-Meteo · 预报非实况。</div>' +
      '</main>' + homeIndicator() + '</div>';
  }

  // ---------- switch sheet ----------
  function behindBase(r) {
    return '<div class="app behind">' + bg(currentHour(r)) + statusBar() + homeScreen(r) + '<div class="scrim"></div>';
  }
  function renderSwitch() {
    const r = currentResort();
    const rows = RESORTS.map(x => {
      const d = dailyFor(x, DATA.today);
      const cur = currentHour(x);
      const col = TIERS[d.tier].color;
      const on = x.id === r.id;
      return '<button class="switch-row' + (on ? ' on' : '') + '" onclick="chooseResort(\'' + x.id + '\')">' +
        '<span class="dot" style="background:' + col + ';box-shadow:0 0 0 3px ' + rgba(col, .14) + '"></span>' +
        '<span class="sw-main"><span class="sw-name">' + x.name + '<span class="mini-pill" style="color:' + col + ';background:' + rgba(col, .14) + '">' + TIERS[d.tier].label + '</span></span><span class="sw-sub">' + x.area + ' · 山顶 ' + tempShort(cur.peak.temp) + ' · ' + windLevel(cur.peak.wind) + '级风</span></span>' +
        '<span class="sw-right">' + tempShort(cur.base.temp) + '<small>' + windLevel(cur.peak.wind) + '级 · 阵风' + windLevel(cur.peak.gust) + '级</small></span>' +
        '<span class="sw-check">' + (on ? '✓' : '') + '</span></button>';
    }).join('');
    return behindBase(r) +
      '<div class="sheet switch-sheet" role="dialog" aria-modal="true" aria-label="切换雪场">' +
        '<div class="handle"></div>' +
        '<div class="sheet-head"><div><div class="sheet-title">切换雪场</div><div class="sheet-sub">崇礼 / 金山岭 · 8 家</div></div>' + closeBtn() + '</div>' +
        '<div class="switch-list">' + rows + '</div>' +
        '<div class="sheet-foot">顶部徽标为今天的日间建议 · 数据 ' + nowTime() + '</div>' +
      '</div></div>';
  }

  // ---------- why sheet ----------
  function renderWhy() {
    const r = currentResort();
    const q = new URLSearchParams(location.search);
    const idx = clamp(Number(q.get('day') || 0), 0, datesOf(r).length - 1);
    const date = datesOf(r)[idx];
    const d = dailyFor(r, date);
    const w = d.worst.peak;
    const t = TIERS[d.tier];
    const col = t.color;
    const wl = windLevel(w.wind), gl = windLevel(w.gust);
    const risk = riskOf(d.worst);
    const ws = windScore(wl), vs = visScore(w.vis), fs = feelScore(w.feels), ls = risk.score;
    const score = overallScore(d.worst);
    const better = betterWindow(r, d, idx);
    const when = idx === 0 ? '今天' : idx === 1 ? '明天' : dayLabel(date, idx);
    const factors = [
      { name: '风力', icon: 'wind', val: wl + '级 / 阵风' + gl + '级', score: ws, color: levelColor(Math.max(wl, gl)) },
      { name: '能见度', icon: 'eye', val: fmtVis(w.vis), score: vs, color: vs >= 80 ? '#30D158' : vs >= 50 ? '#FFD60A' : '#FF453A' },
      { name: '体感温度', icon: 'thermo', val: tempShort(w.feels), score: fs, color: fs >= 80 ? '#30D158' : fs >= 50 ? '#FFD60A' : '#FF453A' },
      { name: '缆车风险', icon: 'cable', val: risk.label, score: ls, color: risk.color },
    ];
    return behindBase(r) +
      '<div class="sheet why-sheet" role="dialog" aria-modal="true" aria-label="建议依据">' +
        '<div class="handle"></div>' +
        '<div class="sheet-head"><div><div class="sheet-title">建议依据</div><div class="sheet-sub">' + when + ' 08:00–17:00 · ' + r.short + ' · 最差 ' + fmtTime(d.worst.time) + '</div></div>' + closeBtn() + '</div>' +
        '<div class="why-verdict tier-' + d.tier + '" style="background:linear-gradient(135deg,' + rgba(col, .34) + ',' + rgba(col, .08) + '),rgba(15,23,34,.82);border-color:' + rgba(col, .42) + '">' +
          '<div class="big-glyph">' + svg(t.icon, 23) + '</div><div class="text"><b>' + t.label + '</b><small>综合适宜度 ' + score + ' / 100 · 分数越高越适合</small></div>' +
        '</div>' +
        '<div class="why-summary">' + reasonFor(d.tier, d.worst) + '。</div>' +
        '<div class="factors">' + factors.map(f => '<div class="factor"><div class="factor-top"><span class="fname">' + svg(f.icon, 12) + f.name + '</span><span><span class="fval">' + f.val + '</span><span class="fscore">' + f.score + '/100</span></span></div><div class="bar"><i style="width:' + clamp(f.score, 3, 100) + '%;background:' + f.color + '"></i></div></div>').join('') + '</div>' +
        '<div class="why-block"><h4>关键原因</h4><p>' + (d.tier === 'hell' ? (w.gust >= 75 ? '阵风达到缆车停运阈值；一旦停运，撤离和救援都会更困难，安全优先。' : w.vis != null && w.vis < 500 ? '能见度过低，雪道边界和同伴都难以辨认，容易迷路或碰撞。' : '风力或体感达到危险级别，山上暴露风险高。') : d.tier === 'poor' ? '风或能见度会影响缆车运行和雪道辨识；如要上山，避开最差时段。' : d.tier === 'okay' ? '风略大或能见度一般，但未达到缆车明显受影响的程度。' : '能见度高、风小、体感可接受，是当天最好的窗口。') + '</p></div>' +
        '<div class="why-block"><h4>更好时段</h4><p><b>' + better + '</b></p></div>' +
        '<button class="why-cta" onclick="go(\'wind\')">查看风力详情 ' + svg('chevron', 13) + '</button>' +
        '<div class="why-foot">仅评估日间 08:00–17:00；缆车状态为天气估算，非雪场官方公告。<br>数据：Open-Meteo · ' + nowTime() + '</div>' +
      '</div></div>';
  }

  // ---------- week ----------
  function renderWeek() {
    const r = currentResort();
    const dates = datesOf(r);
    const days = dates.map((date, i) => dailyFor(r, date));
    const best = days.slice().sort((a, b) => {
      const d = dayTierRank(b.tier) - dayTierRank(a.tier);
      if (d) return d;
      return overallScore(b.best) - overallScore(a.best);
    })[0];
    const bestIdx = days.indexOf(best);
    return '<div class="app">' + bg(currentHour(r)) + statusBar() +
      '<main class="screen week">' + navBack('未来 7 天') +
        '<div class="wind-title">' + r.short + ' · 每日建议</div>' +
        '<div class="wind-sub">仅日间 08:00–17:00 · 点击任意一天看依据</div>' +
        '<div class="week-list" style="margin-top:10px">' + days.map((d, i) => weekRow(r, d, i, false)).join('') + '</div>' +
        '<div class="week-best" onclick="go(\'why\',{day:' + bestIdx + '})"><div class="wb-ico">' + svg('ski', 17) + '</div><div class="wb-main"><div class="wb-kicker">本周最佳</div><b>' + dayLabel(best.date, bestIdx) + ' ' + fmtDate(best.date) + ' · ' + tierLabel(best.tier) + '</b><p>' + shortReason(best.tier, best) + '</p></div><div class="wb-arrow">›</div></div>' +
        '<div class="source-line">建议按当天最差时段的安全风险给出；阵风、能见度、体感和缆车风险加权解释。<br>天气数据：Open-Meteo（CC BY 4.0）· 预报非实况。</div>' +
      '</main>' + homeIndicator() + '</div>';
  }

  // ---------- states ----------
  function stateCard(tier, reason, windowText) {
    const t = TIERS[tier], col = t.color;
    return '<div class="state-card" style="background:linear-gradient(135deg,' + rgba(col, .40) + ',' + rgba(col, .08) + '),#141c26;border-color:' + rgba(col, .44) + '">' +
      '<div class="glyph">' + svg(t.icon, 15) + '</div><div class="sl">' + t.label + '</div><div class="sr">' + reason + '</div><div class="sw">' + windowText + '</div></div>';
  }
  function renderStates() {
    const r = currentResort();
    return '<div class="app">' + bg(currentHour(r)) + statusBar() + '<main class="screen">' +
      '<div class="topline"><span class="region">' + svg('info', 11) + '组件示意 · 非真实预报</span><span class="updated">' + nowTime() + '</span></div>' +
      '<div class="states-title">四档建议与状态</div><div class="states-sub">颜色 + 图标 + 文字三重编码，不单靠颜色区分</div>' +
      '<div class="state-grid">' +
        stateCard('great', '能见度 >10km，山顶风 3 级，体感 -16°', '今天 08:00–17:00') +
        stateCard('okay', '山顶风 5 级，风略大但缆车预计正常', '今天 10:00–15:00') +
        stateCard('poor', '阵风 8 级，缆车可能降速；体感 -27°', '今天 12:00–16:00') +
        stateCard('hell', '阵风 9 级，缆车可能停运；能见度 0.4km', '今天 13:00–15:00') +
      '</div>' +
      '<div class="state-section"><h3>加载 · 离线 · 失败</h3>' +
        '<div class="skeleton"></div><div class="skeleton" style="width:72%"></div>' +
        '<div class="demo-offline" style="margin-top:9px">' + svg('warning', 13) + '离线 · 正在显示 09:54 的数据</div>' +
        '<div class="demo-error" style="margin-top:9px"><b>无法连接天气服务</b><p>请检查网络后重试，或稍后再来。</p><button>重新加载</button></div>' +
      '</div>' +
      '<div class="footer-note">效果图使用 2026-11-18 09:54 的 Open-Meteo 真实预报快照；四档卡片为组件示意。</div>' +
    '</main>' + homeIndicator() + '</div>';
  }

  // ---------- router ----------
  const params = new URLSearchParams(location.search);
  const screen = params.get('screen') || 'home';
  let html;
  if (screen === 'wind') html = renderWind();
  else if (screen === 'week') html = renderWeek();
  else if (screen === 'switch') html = renderSwitch();
  else if (screen === 'why') html = renderWhy();
  else if (screen === 'states') html = renderStates();
  else if (screen === 'home-full') html = renderHome(true);
  else html = renderHome(false);
  document.getElementById('app').innerHTML = html;

  window.go = function (next, extra) {
    const u = new URL(location.href);
    u.searchParams.set('screen', next);
    if (next === 'home') {
      u.searchParams.delete('day');
      u.searchParams.delete('span');
    }
    if (extra) Object.keys(extra).forEach(k => u.searchParams.set(k, extra[k]));
    location.href = u.toString();
  };
  window.chooseResort = function (id) {
    const u = new URL(location.href);
    u.searchParams.set('resort', id);
    u.searchParams.set('screen', 'home');
    location.href = u.toString();
  };
})();
