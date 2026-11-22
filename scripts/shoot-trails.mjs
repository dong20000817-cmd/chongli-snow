import { spawn } from 'node:child_process'
import fs from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9343
const BASE = process.env.SKI_URL || 'http://127.0.0.1:5173'
const OUT = '/tmp/ski-trails'
fs.mkdirSync(OUT, { recursive: true })
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

const seed = {
  version: 1,
  days: {
    '2026-11-22': {
      date: '2026-11-22',
      updatedAt: '2026-11-22T18:26',
      done: { wanlong: true, genting: true, thaiwoo: true, fulong: true, galaxy: true, xueruyi: true, jinshanling: true },
      marks: {
        wanlong: { 长龙道: 'new', 游龙道: 'new', 银龙道: 'snow', 风龙道: 'snow', 赤龙道: 'closed', 金龙道: 'training', 大奔头: 'closed' },
        genting: { 曼陀罗: 'new', 蒲公英: 'new', 雪绒花: 'snow', 野玫瑰: 'closed', 太浩岩壁: 'closed' },
        thaiwoo: { '4A-伦巴': 'tomorrow', '10B-桑巴': 'tomorrow', '4C-华尔兹': 'snow', '10D-现代舞': 'closed' },
        fulong: { 'B2-交响': 'new', 'B8-放克': 'training', 'C1-朋克': 'closed', 'B10-阿卡贝拉': 'snow' },
        galaxy: { 'A9-狮子座': 'tomorrow', 'B5-处女座': 'snow' },
        dolomiti: { 'G-佛罗伦萨': 'closed', 'B-米兰': 'snow', 'C-博洛尼亚': 'new' },
        xueruyi: { A1: 'new', C2: 'new', A5: 'snow', D2: 'closed', D3: 'training' },
        jinshanling: { 火星: 'tomorrow', 牛郎星: 'closed', 北极星: 'training' },
      },
    },
  },
}

try {
  await ep()
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = await new Promise((res, rej) => { const s = new WebSocket(target.webSocketDebuggerUrl); s.onopen = () => res(s); s.onerror = rej })
  ws.onmessage = e => { const m = JSON.parse(e.data); if (!m.id) return; const p = pending.get(m.id); if (!p) return; clearTimeout(p.t); pending.delete(m.id); m.error ? p.rej(Error(m.error.message)) : p.res(m.result) }
  await rpc(ws, 'Page.enable'); await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true, screenWidth: 393, screenHeight: 852 })
  await rpc(ws, 'Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', platform: 'iPhone' })

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/trails/wanlong` })
  await wait(ws, "document.querySelector('.tr-brush')", 'trails')
  await js(ws, "localStorage.removeItem('ski:trail-book:v1'); location.reload()")
  await sleep(1800)
  await wait(ws, "document.querySelector('.tr-resort-tabs')", 'trails reload')

  // 真实交互：全部开放 → 标补雪 → 标关闭 → 标新开
  await js(ws, clickText('.tr-quick button', '全部开放')); await sleep(400)
  await js(ws, clickText('.tr-brush-btn', '补雪中')); await sleep(200)
  await js(ws, `(() => { const rows=[...document.querySelectorAll('.tr-trail')]; for (const n of ['银龙道','风龙道']) { const r=rows.find(x=>x.textContent.includes(n)); if(!r) throw new Error('no '+n); r.click() } return true })()`); await sleep(300)
  await js(ws, clickText('.tr-brush-btn', '临时关闭')); await sleep(200)
  await js(ws, `(() => { const r=[...document.querySelectorAll('.tr-trail')].find(x=>x.textContent.includes('赤龙道')); r.click(); return true })()`); await sleep(300)
  await js(ws, clickText('.tr-brush-btn', '今日新开')); await sleep(200)
  await js(ws, `(() => { const rows=[...document.querySelectorAll('.tr-trail')]; for (const n of ['长龙道','游龙道']) { rows.find(x=>x.textContent.includes(n)).click() } return true })()`); await sleep(400)
  await shot(ws, '01-editor')

  console.log('marked =', await js(ws, "JSON.parse(localStorage.getItem('ski:trail-book:v1')).days['2026-11-22'].marks.wanlong"))
  await js(ws, clickText('.tr-actions button', '下一家')); await sleep(700)
  await shot(ws, '02-next')

  // 种一份 8 家都录过的数据，看情报图
  await js(ws, `localStorage.setItem('ski:trail-book:v1', ${JSON.stringify(JSON.stringify(seed))})`)
  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/trailposter` })
  await sleep(1600)
  await wait(ws, "document.querySelector('.tp-frame')", 'poster')
  await shot(ws, '03-poster-3x4')

  // 导出尺寸校验：把离屏画布挪到可见区，按 2x 截 1080×1440
  await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b1725'; return true })()`)
  await sleep(300)
  await shot(ws, '04-poster-full-3x4', { x: 0, y: 0, width: 540, height: 720, scale: 2 })
  await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:-99999px;top:0;z-index:-1'; return true })()`)

  await js(ws, clickText('.tp-seg button', '9:16')); await sleep(700)
  await shot(ws, '05-poster-9x16')
  await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b1725'; return true })()`)
  await sleep(300)
  await shot(ws, '06-poster-full-9x16', { x: 0, y: 0, width: 540, height: 960, scale: 2 })
  await js(ws, `(() => { const s=document.querySelector('.trail-export-stage'); s.style.cssText='position:fixed;left:-99999px;top:0;z-index:-1'; return true })()`)

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/snow/wanlong` })
  await sleep(1400)
  await wait(ws, "document.querySelector('.cat-section')", 'snow')
  await shot(ws, '07-snow')

  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/dev` })
  await sleep(1800)
  await wait(ws, "document.querySelector('.trail-entry')", 'dev')
  await shot(ws, '08-dev')
  await js(ws, "window.scrollTo(0, document.body.scrollHeight)")
  await sleep(800)
  await shot(ws, '09-dev-bottom')

  ws.close()
} finally {
  chrome.kill('SIGTERM'); await sleep(300)
  try { fs.rmSync('/tmp/chrome-trails-qa-' + process.pid, { recursive: true, force: true }) } catch (_) { }
}
