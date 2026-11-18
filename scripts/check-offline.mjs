// 线上离线自检：先加载一次，再断网刷新，确认 SW + localStorage 仍能显示
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9335
const URL = process.env.SKI_URL || 'https://dong20000817-cmd.github.io/chongli-snow/'
const profile = '/tmp/chrome-ski-offline-' + process.pid
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--disable-breakpad',
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let id = 0
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
    const n = ++id
    const timer = setTimeout(() => { pending.delete(n); reject(new Error('timeout ' + method)) }, 30000)
    pending.set(n, { resolve, reject, timer })
    ws.send(JSON.stringify({ id: n, method, params }))
  })
}
async function evalJs(ws, expression) {
  const r = await rpc(ws, 'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  return r.result?.value
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
  await rpc(ws, 'Page.enable'); await rpc(ws, 'Runtime.enable'); await rpc(ws, 'Network.enable')
  await rpc(ws, 'Page.navigate', { url: URL })
  let ready = false
  for (let i = 0; i < 60; i++) {
    const has = await evalJs(ws, "!!document.querySelector('.verdict')")
    if (has) { ready = true; break }
    await sleep(500)
  }
  if (!ready) throw new Error('首次加载未渲染')
  const sw = await evalJs(ws, "navigator.serviceWorker.ready.then(r => !!r.active)")
  console.log('SW active:', sw)
  await rpc(ws, 'Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  await rpc(ws, 'Page.reload')
  await sleep(1800)
  const text = await evalJs(ws, 'document.body.innerText')
  const hasVerdict = text.includes('建议') || text.includes('滑雪场')
  const hasOffline = text.includes('离线') || text.includes('过期')
  console.log('offline render:', hasVerdict, 'offline banner:', hasOffline)
  fs.writeFileSync('/tmp/ski-offline.png', Buffer.from((await rpc(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true })).data, 'base64'))
  if (!hasVerdict) process.exitCode = 1
  ws.close()
} finally {
  chrome.kill('SIGTERM')
  await sleep(300)
  try { fs.rmSync(profile, { recursive: true, force: true }) } catch (_) {}
}
