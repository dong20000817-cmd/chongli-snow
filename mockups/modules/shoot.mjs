import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'screens')
const PORT = 9336
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href
const SHOTS = [
  { name: '01-weather', screen: 'weather' },
  { name: '02-road', screen: 'road' },
  { name: '03-road-detail', screen: 'road-detail' },
  { name: '04-snow', screen: 'snow' },
  { name: '05-snow-detail', screen: 'snow-detail' },
  { name: '06-nav', screen: 'nav' },
]
fs.mkdirSync(OUT, { recursive: true })
const profile = '/tmp/chrome-ski-mod-' + process.pid
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--disable-breakpad',
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let mid = 0
const pending = new Map()
async function endpoint() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return } catch (_) {}
    await sleep(150)
  }
  throw new Error('chrome not ready')
}
function rpc(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++mid
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout ' + method)) }, 30000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
try {
  await endpoint()
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = await new Promise((res, rej) => { const s = new WebSocket(target.webSocketDebuggerUrl); s.onopen = () => res(s); s.onerror = rej })
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data)
    if (!m.id) return
    const p = pending.get(m.id)
    if (!p) return
    clearTimeout(p.timer); pending.delete(m.id)
    if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result)
  }
  await rpc(ws, 'Page.enable'); await rpc(ws, 'Runtime.enable')
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true, screenWidth: 393, screenHeight: 852 })
  await rpc(ws, 'Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', platform: 'iPhone' })
  for (const s of SHOTS) {
    await rpc(ws, 'Page.navigate', { url: PAGE + '?screen=' + s.screen })
    await sleep(650)
    await rpc(ws, 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true })
    await sleep(200)
    const shot = await rpc(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false })
    fs.writeFileSync(path.join(OUT, s.name + '.png'), Buffer.from(shot.data, 'base64'))
    console.log(s.name)
  }
  ws.close()
} finally {
  chrome.kill('SIGTERM')
  await sleep(300)
  try { fs.rmSync(profile, { recursive: true, force: true }) } catch (_) {}
}
