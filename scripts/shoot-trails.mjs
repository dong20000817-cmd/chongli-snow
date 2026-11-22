import { spawn } from 'node:child_process'
import fs from 'node:fs'
import trails from '../src/data/trails.json' with { type: 'json' }

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9343
const BASE = process.env.SKI_URL || 'http://127.0.0.1:5173'
const OUT = '/tmp/ski-trails'
fs.mkdirSync(OUT, { recursive: true })

const T = trails.resorts
const opened = {}
const marks = {}
const done = {}
const splits = {}
const DAY = '2026-11-22'
const ACTIVE = ['wanlong', 'genting', 'thaiwoo', 'fulong', 'galaxy', 'xueruyi']

function openAll(id) {
  opened[id] = {}
  for (const t of T[id].trails) opened[id][t.name] = true
}
for (const id of ACTIVE) openAll(id)
done.wanlong = true; done.genting = true; done.thaiwoo = true; done.fulong = true; done.galaxy = true; done.xueruyi = true

// 万龙：银龙道分上/下段，上段补雪
splits.wanlong = { 银龙道: true }
delete opened.wanlong['银龙道']
opened.wanlong['银龙道|上段'] = true
opened.wanlong['银龙道|下段'] = true
marks.wanlong = {
  长龙道: 'new', 游龙道: 'new',
  '银龙道|上段': 'snow', 风龙道: 'snow',
  金龙道: 'training',
  赤龙道: 'closed', 大奔头: 'closed', 雾龙道: 'closed', 霜龙道: 'closed',
}
marks.genting = { 曼陀罗: 'new', 蒲公英: 'new', 雪绒花: 'snow', 野玫瑰: 'closed', 太浩岩壁: 'closed' }
marks.thaiwoo = { '4A-伦巴': 'tomorrow', '10B-桑巴': 'tomorrow', '10A-巴洛克': 'tomorrow', '10D-现代舞': 'tomorrow', '4C-华尔兹': 'snow', '4F-吉特巴': 'closed' }
marks.fulong = { 'B2-交响': 'new', 'B8-放克': 'training', 'C1-朋克': 'closed', 'B9-摇摆': 'closed', 'B10-阿卡贝拉': 'snow' }
marks.galaxy = { 'A9-狮子座': 'tomorrow', 'B5-处女座': 'snow' }
marks.xueruyi = { A1: 'new', C2: 'new', A5: 'snow', D3: 'training', D2: 'closed', D5: 'closed' }

const seed = {
  version: 2,
  opened,
  splits,
  days: { [DAY]: { date: DAY, marks, done, updatedAt: '2026-11-22T18:26' } },
}

const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--disable-breakpad', '--hide-scrollbars', '--no-first-run', '--mute-audio', '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/chrome-trails-qa-' + process.pid, 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let id = 0; const pending = new Map()
async function ep() { for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return } catch (_) { } await sleep(150) } throw Error('no chrome') }
function rpc(ws, m, p = {}) { return new Promise((res, rej) => { const n = ++id; const t = setTimeout(() => { pending.delete(n); rej(Error('timeout ' + m)) }, 30000); pending.set(n, { res, rej, t }); ws.send(JSON.stringify({ id: n, method: m, params: p })) }) }
async function js(ws, expr) { const r = await rpc(ws, 'Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result?.value }
async function wait(ws, expr, label) { for (let i = 0; i < 100; i++) { if (await js(ws, `!!(${expr})`)) return; await sleep(200) } throw Error('wait ' + label) }
async function shot(ws, name, clip) {
  const r = await rpc(ws, 'Page.captureScreenshot', clip ? { format: 'png', fromSurface: true, captureBeyondViewport: true, clip } : { format: 'png', fromSurface: true, captureBeyondViewport: false })
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64')); console.log('shot', name)
}
const clickText = (sel, text) => `(() => { const els=[...document.querySelectorAll(${JSON.stringify(sel)})]; const el=els.find(e=>e.textContent.trim().includes(${JSON.stringify(text)})); if(!el) throw new Error('no ${text}'); el.click(); return true })()`

try {
  await ep()
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = await new Promise((res, rej) => { const s = new WebSocket(target.webSocketDebuggerUrl); s.onopen = () => res(s); s.onerror = rej })
  ws.onmessage = e => { const m = JSON.parse(e.data); if (!m.id) return; const p = pending.get(m.id); if (!p) return; clearTimeout(p.t); pending.delete(m.id); m.error ? p.rej(Error(m.error.message)) : p.res(m.result) }
  await rpc(ws, 'Page.enable'); await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true, screenWidth: 393, screenHeight: 852 })
  await rpc(ws, 'Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', platform: 'iPhone' })

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/home/wanlong` })
  await sleep(2500)
  await js(ws, `localStorage.setItem('ski:trail-book:v1', ${JSON.stringify(JSON.stringify(seed))}); localStorage.removeItem('ski:trail-poster-exclude:v1')`)

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/trails/wanlong` })
  await sleep(1800)
  await wait(ws, "document.querySelector('.tr-brush')", 'editor')
  await shot(ws, '20-editor-top')
  await js(ws, "window.scrollTo(0, 760)"); await sleep(500)
  await shot(ws, '21-editor-blue')

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/trailposter` })
  await sleep(2000)
  await wait(ws, "document.querySelector('.tp-frame')", 'poster')
  await shot(ws, '23-poster-3x4')
  console.log('preview h =', await js(ws, "document.querySelector('.trail-card').offsetHeight"))
  console.log('rows =', await js(ws, "document.querySelectorAll('.tc-row').length"))

  // 离屏画布挪出来，按真实高度 2x 截图
  const h = await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b1725'; return document.querySelector('.trail-export-stage .trail-card').offsetHeight })()`)
  await sleep(300)
  await shot(ws, '24-poster-full-3x4', { x: 0, y: 0, width: 540, height: h, scale: 2 })
  console.log('export height =', h)
  await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:-99999px;top:0;z-index:-1'; return true })()`)

  await js(ws, clickText('.tp-seg button', '9:16')); await sleep(800)
  await shot(ws, '25-poster-9x16')
  const h2 = await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b1725'; return document.querySelector('.trail-export-stage .trail-card').offsetHeight })()`)
  await sleep(300)
  await shot(ws, '26-poster-full-9x16', { x: 0, y: 0, width: 540, height: h2, scale: 2 })
  console.log('export height 9:16 =', h2)
  await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:-99999px;top:0;z-index:-1'; return true })()`)

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/snow/xueruyi` })
  await sleep(1600)
  await shot(ws, '28-snow-xueruyi')

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/dev` })
  await sleep(1800)
  await shot(ws, '29-dev')

  ws.close()
} finally {
  chrome.kill('SIGTERM'); await sleep(300)
  try { fs.rmSync('/tmp/chrome-trails-qa-' + process.pid, { recursive: true, force: true }) } catch (_) { }
}
