// 拉取 8 家雪场的真实预报快照，生成 mockups/data.js（设计样张用）
import fs from 'node:fs';

const RESORTS = [
  { id: 'wanlong',     name: '万龙滑雪场',       short: '万龙',   region: '崇礼', area: '红花梁',           lat: 40.9613,   lon: 115.3931,   baseElev: 1600, peakElev: 2110 },
  { id: 'genting',     name: '密苑云顶滑雪场',   short: '云顶',   region: '崇礼', area: '太子城',           lat: 40.9503,   lon: 115.4258,   baseElev: 1580, peakElev: 2100 },
  { id: 'thaiwoo',     name: '太舞滑雪小镇',     short: '太舞',   region: '崇礼', area: '玉石梁',           lat: 40.8833,   lon: 115.4361,   baseElev: 1650, peakElev: 2160 },
  { id: 'fulong',      name: '富龙滑雪场',       short: '富龙',   region: '崇礼', area: '西湾子',           lat: 40.9757,   lon: 115.3092,   baseElev: 1580, peakElev: 1860 },
  { id: 'galaxy',      name: '翠云山银河滑雪场', short: '银河',   region: '崇礼', area: '翠云山',           lat: 40.9987,   lon: 115.3055,   baseElev: 1620, peakElev: 2000 },
  { id: 'dolomiti',    name: '多乐美地滑雪场',   short: '多乐',   region: '崇礼', area: '喜鹊梁',           lat: 40.8350,   lon: 115.3836,   baseElev: 1650, peakElev: 2074 },
  { id: 'xueruyi',     name: '雪如意滑雪场',     short: '雪如意', region: '崇礼', area: '古杨树 · 冬奥核心区', lat: 40.910315, lon: 115.471951, baseElev: 1600, peakElev: 1800 },
  { id: 'jinshanling', name: '金山岭银河滑雪场', short: '金山岭', region: '承德', area: '滦平 · 大雁子沟',   lat: 40.785197, lon: 117.494809, baseElev: 1150, peakElev: 1679 },
];

const lats = [], lons = [], els = [];
for (const r of RESORTS) {
  lats.push(r.lat, r.lat);
  lons.push(r.lon, r.lon);
  els.push(r.baseElev, r.peakElev);
}

const params = new URLSearchParams({
  latitude: lats.join(','),
  longitude: lons.join(','),
  elevation: els.join(','),
  hourly: 'temperature_2m,apparent_temperature,weather_code,is_day,visibility,wind_speed_10m,wind_gusts_10m,wind_direction_10m,snowfall',
  timezone: 'Asia/Shanghai',
  forecast_days: '7',
  wind_speed_unit: 'kmh',
  temperature_unit: 'celsius',
  precipitation_unit: 'mm',
});

const url = 'https://api.open-meteo.com/v1/forecast?' + params;
console.log('GET', url.slice(0, 120) + '…');
const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
const arr = await res.json();
if (!Array.isArray(arr) || arr.length !== RESORTS.length * 2) {
  throw new Error('Unexpected locations: ' + (Array.isArray(arr) ? arr.length : typeof arr));
}

const now = new Date();
const nowLocal = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(now).replace(' ', 'T');
const today = nowLocal.slice(0, 10);

const out = {
  generatedAt: nowLocal,
  today,
  timezone: 'Asia/Shanghai',
  source: 'Open-Meteo best_match',
  note: '设计样张：真实预报快照；山顶/山底按海拔订正。',
  resorts: {},
};

for (let i = 0; i < RESORTS.length; i++) {
  const meta = RESORTS[i];
  const b = arr[i * 2], p = arr[i * 2 + 1];
  if (!b?.hourly || !p?.hourly) throw new Error('Missing hourly for ' + meta.id);
  const hb = b.hourly, hp = p.hourly;
  out.resorts[meta.id] = {
    ...meta,
    hourly: hb.time.map((time, j) => ({
      time,
      base: {
        temp: hb.temperature_2m[j], feels: hb.apparent_temperature[j], code: hb.weather_code[j],
        isDay: hb.is_day[j], vis: hb.visibility[j], wind: hb.wind_speed_10m[j],
        gust: hb.wind_gusts_10m[j], dir: hb.wind_direction_10m[j], snow: hb.snowfall[j],
      },
      peak: {
        temp: hp.temperature_2m[j], feels: hp.apparent_temperature[j], code: hp.weather_code[j],
        isDay: hp.is_day[j], vis: hp.visibility[j], wind: hp.wind_speed_10m[j],
        gust: hp.wind_gusts_10m[j], dir: hp.wind_direction_10m[j], snow: hp.snowfall[j],
      },
    })),
  };
}

fs.writeFileSync(new URL('./data.js', import.meta.url),
  '/* 自动生成：node mockups/fetch-data.mjs；不要手改 */\nwindow.MOCK_DATA = ' + JSON.stringify(out) + ';\n');
console.log('Wrote mockups/data.js ·', Object.keys(out.resorts).length, 'resorts ·', nowLocal);
