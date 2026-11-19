import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ROOT=path.dirname(fileURLToPath(import.meta.url))
const OUT=path.join(ROOT,'screens')
const PORT=9340
const PAGE=pathToFileURL(path.join(ROOT,'index.html')).href
const SHOTS=[
 {name:'01-list-top',q:'cat=all',w:393,h:852,scale:3},
 {name:'02-list-full',q:'cat=all&full=1',w:393,h:1900,scale:2},
 {name:'03-list-black',q:'cat=black',w:393,h:852,scale:3}
]
fs.mkdirSync(OUT,{recursive:true})
const profile='/tmp/chrome-ski-list-'+process.pid
const chrome=spawn(CHROME,['--headless=new','--no-sandbox','--disable-gpu','--disable-crash-reporter','--disable-breakpad','--hide-scrollbars','--no-first-run','--remote-debugging-port='+PORT,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
let id=0;const pending=new Map()
async function ep(){for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}/json/version`);if(r.ok)return}catch(_){}await sleep(150)}throw Error('no chrome')}
function rpc(ws,m,p={}){return new Promise((res,rej)=>{const n=++id;const t=setTimeout(()=>{pending.delete(n);rej(Error('timeout '+m))},30000);pending.set(n,{res,rej,t});ws.send(JSON.stringify({id:n,method:m,params:p}))})}
try{
 await ep();const target=await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`,{method:'PUT'})).json()
 const ws=await new Promise((res,rej)=>{const s=new WebSocket(target.webSocketDebuggerUrl);s.onopen=()=>res(s);s.onerror=rej})
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=pending.get(m.id);if(!p)return;clearTimeout(p.t);pending.delete(m.id);m.error?p.rej(Error(m.error.message)):p.res(m.result)}
 await rpc(ws,'Page.enable');await rpc(ws,'Runtime.enable')
 for(const s of SHOTS){
  await rpc(ws,'Emulation.setDeviceMetricsOverride',{width:s.w,height:s.h,deviceScaleFactor:s.scale,mobile:true,screenWidth:s.w,screenHeight:s.h})
  await rpc(ws,'Page.navigate',{url:PAGE+'?'+s.q})
  await sleep(600)
  await rpc(ws,'Runtime.evaluate',{expression:'document.fonts && document.fonts.ready',awaitPromise:true})
  await sleep(150)
  const shot=await rpc(ws,'Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})
  fs.writeFileSync(path.join(OUT,s.name+'.png'),Buffer.from(shot.data,'base64'))
  console.log(s.name)
 }
 ws.close()
}finally{chrome.kill('SIGTERM');await sleep(300);try{fs.rmSync(profile,{recursive:true,force:true})}catch(_){}}
