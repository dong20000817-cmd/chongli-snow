import { spawn } from 'node:child_process'
import fs from 'node:fs'
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT=9342
const BASE=process.env.SKI_URL || 'http://127.0.0.1:5173'
const OUT='/tmp/ski-modules'
fs.mkdirSync(OUT,{recursive:true})
const chrome=spawn(CHROME,['--headless=new','--no-sandbox','--disable-gpu','--disable-crash-reporter','--disable-breakpad','--hide-scrollbars','--no-first-run','--mute-audio','--remote-debugging-port='+PORT,'--user-data-dir=/tmp/chrome-mod-qa-'+process.pid,'about:blank'],{stdio:'ignore'})
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
let id=0;const pending=new Map()
async function ep(){for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${PORT}/json/version`);if(r.ok)return}catch(_){}await sleep(150)}throw Error('no chrome')}
function rpc(ws,m,p={}){return new Promise((res,rej)=>{const n=++id;const t=setTimeout(()=>{pending.delete(n);rej(Error('timeout '+m))},30000);pending.set(n,{res,rej,t});ws.send(JSON.stringify({id:n,method:m,params:p}))})}
async function js(ws,expr){const r=await rpc(ws,'Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});return r.result?.value}
async function wait(ws,expr,label){for(let i=0;i<80;i++){if(await js(ws,`!!(${expr})`))return;await sleep(250)}throw Error('wait '+label)}
async function shot(ws,name){const r=await rpc(ws,'Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(`${OUT}/${name}.png`,Buffer.from(r.data,'base64'));console.log(name)}
try{
 await ep();const target=await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`,{method:'PUT'})).json()
 const ws=await new Promise((res,rej)=>{const s=new WebSocket(target.webSocketDebuggerUrl);s.onopen=()=>res(s);s.onerror=rej})
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=pending.get(m.id);if(!p)return;clearTimeout(p.t);pending.delete(m.id);m.error?p.rej(Error(m.error.message)):p.res(m.result)}
 await rpc(ws,'Page.enable');await rpc(ws,'Runtime.enable')
 await rpc(ws,'Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:3,mobile:true,ScreenWidth:393,screenWidth:393,screenHeight:852})
 await rpc(ws,'Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',platform:'iPhone'})
 await rpc(ws,'Page.navigate',{url:`${BASE}/#/home/wanlong`}); await wait(ws,"document.querySelector('.verdict')",'home'); await sleep(700); await shot(ws,'home')
 await js(ws,"document.querySelector('.tab-ham').click()"); await sleep(400); await shot(ws,'switch')
 await js(ws,"document.querySelector('.sheet-close').click()"); await sleep(300)
 await js(ws,"location.hash='#/road'"); await wait(ws,"document.querySelector('.road-overall')",'road'); await sleep(500); await shot(ws,'road')
 await js(ws,"document.querySelector('.tab-ham').click()"); await sleep(400); await shot(ws,'routes')
 await js(ws,"document.querySelector('.sheet-close').click()"); await sleep(300)
 await js(ws,"location.hash='#/snow'"); await wait(ws,"document.querySelector('.list-summary')",'snow'); await sleep(500); await shot(ws,'snow')
 await js(ws,"location.hash='#/dev'"); await wait(ws,"document.querySelector('.digest-preview')",'dev'); await sleep(1200); await shot(ws,'dev')
 ws.close()
}finally{chrome.kill('SIGTERM');await sleep(300);try{fs.rmSync('/tmp/chrome-mod-qa-'+process.pid,{recursive:true,force:true})}catch(_){}}
