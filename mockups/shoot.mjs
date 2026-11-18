// 使用 Chrome DevTools Protocol 截取精确 393×852 @3x 效果图
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'screens');
const PORT = 9333;
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;

const SHOTS = [
  { name: '01-home', screen: 'home', w: 393, h: 852, scale: 3 },
  { name: '02-home-full', screen: 'home-full', w: 393, h: 1600, scale: 2 },
  { name: '03-wind', screen: 'wind', w: 393, h: 852, scale: 3 },
  { name: '04-week', screen: 'week', w: 393, h: 852, scale: 3 },
  { name: '05-switch', screen: 'switch', w: 393, h: 852, scale: 3 },
  { name: '06-why', screen: 'why', w: 393, h: 852, scale: 3 },
  { name: '07-states', screen: 'states', w: 393, h: 852, scale: 3 },
];

fs.mkdirSync(OUT, { recursive: true });
const profile = '/tmp/chrome-ski-shoot-' + process.pid;
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-crash-reporter', '--disable-breakpad',
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitEndpoint() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/json/version');
      if (r.ok) return;
    } catch (_) {}
    await sleep(150);
  }
  throw new Error('Chrome remote debugging not ready');
}
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
  });
}
let msgId = 0;
function rpc(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 30000);
    const pending = rpc.pending || (rpc.pending = new Map());
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function wire(ws) {
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (!m.id) return;
    const p = rpc.pending && rpc.pending.get(m.id);
    if (!p) return;
    clearTimeout(p.timer);
    rpc.pending.delete(m.id);
    if (m.error) p.reject(new Error(m.error.message));
    else p.resolve(m.result);
  };
}

try {
  await waitEndpoint();
  const target = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' })).json();
  const ws = await connect(target.webSocketDebuggerUrl);
  wire(ws);
  await rpc(ws, 'Page.enable');
  await rpc(ws, 'Runtime.enable');
  await rpc(ws, 'Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
  });

  for (const s of SHOTS) {
    await rpc(ws, 'Emulation.setDeviceMetricsOverride', {
      width: s.w, height: s.h, deviceScaleFactor: s.scale, mobile: true,
      screenWidth: s.w, screenHeight: s.h,
    });
    const url = PAGE + '?screen=' + s.screen;
    await rpc(ws, 'Page.navigate', { url });
    await sleep(650);
    // 等字体/布局稳定
    await rpc(ws, 'Runtime.evaluate', { expression: 'document.fonts && document.fonts.ready', awaitPromise: true });
    await sleep(180);
    const shot = await rpc(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    const file = path.join(OUT, s.name + '.png');
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    const st = fs.statSync(file);
    console.log(s.name, s.w + '×' + s.h + ' @' + s.scale + 'x', (st.size / 1024).toFixed(0) + 'KB');
  }

  // 效果图总览
  await rpc(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1600, height: 2450, deviceScaleFactor: 1.5, mobile: false,
    screenWidth: 1600, screenHeight: 2450,
  });
  await rpc(ws, 'Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/157 Safari/537.36' });
  await rpc(ws, 'Page.navigate', { url: pathToFileURL(path.join(ROOT, 'overview.html')).href });
  await sleep(900);
  await rpc(ws, 'Runtime.evaluate', { expression: 'Promise.all(Array.from(document.images).map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; })))', awaitPromise: true });
  await sleep(300);
  const overview = await rpc(ws, 'Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  const overviewPath = path.join(OUT, '00-overview.png');
  fs.writeFileSync(overviewPath, Buffer.from(overview.data, 'base64'));
  const ost = fs.statSync(overviewPath);
  console.log('00-overview 1600×2450 @1.5x', (ost.size / 1024).toFixed(0) + 'KB');
  ws.close();
} finally {
  chrome.kill('SIGTERM');
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
}
