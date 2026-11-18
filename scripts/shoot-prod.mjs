// 生产版截图（本地 dev server）：393×852 @3x
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9334
const BASE = process.env.SKI_URL || 'http://127.0.0.1:5173'
const VW = Number(process.env.SKI_W || 393)
const VH = Number(process.env.SKI_H || 852)
const OUT = '/tmp/ski-prod'
fs.mkdirSync(OUT, { recursive: true })
const profile = '/tmp/chrome-ski-prod-' + process.pid
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--disable-breakpad',
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let msgId = 0
const pending = new Map()
async function waitEndpoint() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return } catch (_) {}
    await sleep(150)
  }
  throw new Error('Chrome not ready')
}
function rpc(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout ' + method)) }, 30000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
function wire(ws) {
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data)
    if (!m.id) return
    const p = pending.get(m.id)
    if (!p) return
    clearTimeout(p.timer); pending.delete(m.id)
    if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result)
  }
}
async function evalJs(ws, expression) {
  const r = await rpc(ws, 'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  return r.result?.value
}
async function shot(ws, name) {
  const r = await rpc(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'))
  console.log(name)
}
async function waitFor(ws, expr, label) {
  for (let i = 0; i < 80; i++) {
    if (await evalJs(ws, `!!(${expr})`)) return
    await sleep(250)
  }
  throw new Error('waitFor timeout: ' + label)
}
try {
  await waitEndpoint()
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = await new Promise((res, rej) => { const s = new WebSocket(target.webSocketDebuggerUrl); s.onopen = () => res(s); s.onerror = rej })
  wire(ws)
  await rpc(ws, 'Page.enable'); await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 3, mobile: true, screenWidth: VW, screenHeight: VH })
  await rpc(ws, 'Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', platform: 'iPhone' })
  await rpc(ws, 'Page.navigate', { url: `${BASE}/#/home/wanlong` })
  await waitFor(ws, "document.querySelector('.verdict')", 'home')
  await evalJs(ws, 'localStorage.clear()')
  await rpc(ws, 'Page.reload'); await sleep(800)
  await waitFor(ws, "document.querySelector('.verdict')", 'home2')
  await sleep(600)
  await shot(ws, 'home')

  await evalJs(ws, "document.querySelector('.fab').click()")
  await sleep(500)
  await shot(ws, 'switch')
  await evalJs(ws, "document.querySelector('.sheet-close').click()")
  await sleep(300)

  await evalJs(ws, "document.querySelector('.verdict-link').click()")
  await sleep(500)
  await shot(ws, 'why')
  await evalJs(ws, "document.querySelector('.sheet-close').click()")
  await sleep(300)

  await evalJs(ws, "document.querySelector('.card-link').click()")
  await sleep(800)
  await shot(ws, 'wind')

  await evalJs(ws, "location.hash='#/week/wanlong'")
  await sleep(800)
  await waitFor(ws, "document.querySelector('.week-best')", 'week')
  await shot(ws, 'week')

  ws.close()
} finally {
  chrome.kill('SIGTERM')
  await sleep(300)
  try { fs.rmSync(profile, { recursive: true, force: true }) } catch (_) {}
}
