import { useEffect, useMemo, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import type { Snapshot } from '../lib/types'
import { buildDigest } from '../lib/digest'
import { buildPosterData, loadPosterSettings, posterFilename } from '../lib/poster'
import { PosterCard } from '../components/PosterCard'
import { TrailDigestCard } from '../components/TrailDigestCard'
import { exportPosterImage } from '../lib/export'
import { ROAD_DATA, isToday } from '../lib/status'
import {
  buildTrailDigest,
  emptyDay,
  loadBook,
  trailPosterFilename,
  type TrailDay,
  type TrailDigest,
} from '../lib/trails'
import { RESORTS } from '../data/resorts'
import { WeatherDigestCard, SnowDigestCard, RoadDigestCard } from '../components/DigestCards'
import { Icon } from '../components/Icons'

export function DevPage({ snapshot, resortId, onRefresh, refreshing }: {
  snapshot: Snapshot
  resortId: string
  onRefresh: () => void
  refreshing: boolean
}) {
  const [day, setDay] = useState<TrailDay | null>(null)
  useEffect(() => {
    setDay(loadBook(snapshot.today).day)
  }, [snapshot.today])

  const digest = useMemo(() => buildDigest(snapshot, day ?? undefined), [snapshot, day])
  const trailDigest: TrailDigest = useMemo(
    () => buildTrailDigest(day ?? emptyDay(snapshot.today), snapshot.today, day?.updatedAt.slice(11, 16) || snapshot.generatedAt.slice(11, 16)),
    [day, snapshot],
  )

  const weatherRef = useRef<HTMLDivElement>(null)
  const snowRef = useRef<HTMLDivElement>(null)
  const roadRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [posterBusy, setPosterBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const posterSettings = useMemo(() => loadPosterSettings(snapshot), [snapshot])
  const posterData = useMemo(() => buildPosterData(snapshot, posterSettings), [snapshot, posterSettings])
  const posterLayout = { grid: '双列版', list: '榜单版', single: '单雪场版' }[posterSettings.layout]
  const thumbW = posterSettings.size === '3:4' ? 64 : 56
  const thumbH = posterSettings.size === '3:4' ? 85 : 99
  const posterSingle = posterData.rows.find(r => r.resort.id === resortId) ?? posterData.best

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 2600)
  }

  const exportCard = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!ref.current) return
    setBusy(name)
    try {
      const blob = await toBlob(ref.current, { pixelRatio: 2, backgroundColor: '#0b1725', cacheBust: true })
      if (!blob) throw new Error('empty blob')
      const file = new File([blob], `${name}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '滑雪天气通 · 每日情报' })
          showToast('已打开系统分享')
          return
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
      showToast('图片已生成，可在下载/新窗口中长按保存')
    } catch {
      showToast('导出失败，请重试或截图保存')
    } finally {
      setBusy(null)
    }
  }

  const directSavePoster = async () => {
    if (!posterRef.current || posterBusy) return
    setPosterBusy(true)
    try {
      const result = await exportPosterImage(posterRef.current, posterFilename(posterSettings, posterData), '滑雪天气通 · 天气概览图')
      if (result === 'shared') showToast('已打开系统分享 · 点「存储图像」进相册')
      else if (result === 'downloaded') showToast('已下载 PNG · 可在「文件」里长按存相册')
    } catch {
      showToast('导出失败，请重试或截图保存')
    } finally {
      setPosterBusy(false)
    }
  }

  const saveTrailDigest = async () => {
    if (!trailRef.current || busy === 'trail') return
    setBusy('trail')
    try {
      const result = await exportPosterImage(trailRef.current, trailPosterFilename(trailDigest, '3:4'), '滑雪天气通 · 雪道情报')
      if (result === 'shared') showToast('已打开系统分享 · 点「存储图像」进相册')
      else if (result === 'downloaded') showToast('已下载 PNG · 可在「文件」里长按存相册')
    } catch {
      showToast('导出失败，请重试或截图保存')
    } finally {
      setBusy(null)
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(digest.text)
      showToast('今日文案已复制')
    } catch {
      showToast('复制失败，请手动选择文案')
    }
  }

  const demo = ROAD_DATA.isDemo
  const snowStale = !day?.updatedAt
  const roadStale = !isToday(ROAD_DATA.updatedAt, snapshot.today)
  const doneCount = RESORTS.filter(r => day?.done[r.id]).length
  const trailProgress = Math.round((trailDigest.markedResorts / RESORTS.length) * 100)

  return (
    <main className="screen dev-screen">
      <div className="dev-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <a className="dev-back" href={`#/home/${resortId}`} aria-label="返回"><Icon name="back" size={16} /></a>
          <div><div className="dev-title">开发者简报</div><div className="dev-sub">每天 07:30 · 三张图 + 雪道情报 + 一段文案</div></div>
        </div>
        <button className="refresh-btn" onClick={onRefresh} aria-label="刷新天气">
          <Icon name="refresh" size={12} />
          <span>{refreshing ? '更新中' : '刷新'}</span>
        </button>
      </div>

      <div className="poster-entry">
        <div className="poster-entry-thumb" style={{ width: thumbW, height: thumbH }}>
          <div
            className="poster-entry-thumb-inner"
            style={{ width: 540, height: posterSettings.size === '3:4' ? 720 : 960, transform: `scale(${thumbW / 540})` }}
          >
            <PosterCard data={posterData} settings={posterSettings} single={posterSingle} />
          </div>
        </div>
        <div className="poster-entry-main">
          <div className="poster-entry-kicker"><span className="new">NEW</span> 每天 07:30</div>
          <div className="poster-entry-title">天气概览图</div>
          <div className="poster-entry-sub">{posterLayout} · {posterSettings.size === '3:4' ? '1080×1440' : '1080×1920'} · 可微调</div>
          <div className="poster-entry-actions">
            <a className="primary" href={`#/poster/${resortId}`}>微调并下载</a>
            <button onClick={directSavePoster} disabled={posterBusy}>{posterBusy ? '生成中…' : '直接保存'}</button>
          </div>
        </div>
      </div>

      <div className="trail-entry">
        <div className="trail-entry-top">
          <div>
            <div className="poster-entry-kicker"><span className="new mint">NEW</span> 手动录入 · 自动顺延</div>
            <div className="trail-entry-title">雪道情报</div>
            <div className="trail-entry-sub">已录 {doneCount}/8 家 · 标注 {trailDigest.markedTrails} 条 · 共 {trailDigest.totalTrails} 条雪道</div>
          </div>
          <a className="trail-entry-go" href="#/trailposter">情报图 →</a>
        </div>
        <div className="trail-entry-bar"><i style={{ width: `${trailProgress}%` }} /></div>
        <div className="poster-entry-actions">
          <a className="primary" href={`#/trails/${resortId}`}>{doneCount ? '继续录入' : '开始录入'}</a>
          <a href={`#/snow/${resortId}`}>看雪道页</a>
        </div>
      </div>

      <div className="list-summary" style={{ background: 'linear-gradient(135deg,rgba(10,132,255,.18),rgba(10,132,255,.04)),rgba(255,255,255,.06)', borderColor: 'rgba(10,132,255,.2)' }}>
        <div className="top">
          <div><div className="k">{digest.isTomorrow ? '明日情报' : '今日情报'}</div><div className="big" style={{ fontSize: 25 }}>{digest.dateLabel}</div></div>
          <div className="summary-side"><b>{digest.weather.length} 家雪场</b>雪道人工录入 · {ROAD_DATA.isDemo ? '路况示例' : '路况已接入'}</div>
        </div>
        <div className="desc">天气、雪道、路况三张卡片按 3:4 生成；雪道情报图汇总你今天的标注，适合小红书竖版发布。</div>
        <div className="meta">天气快照 {snapshot.generatedAt.slice(11, 16)} · 雪道 {day?.updatedAt ? day.updatedAt.slice(11, 16) : '未录入'} · 路况 {ROAD_DATA.updatedAt.slice(11, 16)}</div>
      </div>

      <div className="dev-actions">
        <button className="primary" onClick={copyText}>复制文案</button>
        <button onClick={() => exportCard(weatherRef, `滑雪天气通-天气-${digest.date}`)}>只存天气图</button>
      </div>

      {demo && <div className="advice" style={{ marginTop: 10 }}><b>数据提醒：</b>路况当前为演示数据，发布前请更新官方信息；天气为实时预报，雪道为你手动录入。</div>}
      {(snowStale || roadStale) && <div className="advice" style={{ color: '#FFB3AD', background: 'rgba(255,69,58,.09)', borderColor: 'rgba(255,69,58,.2)' }}><b>非今日数据：</b>{snowStale ? '雪道 ' : ''}{roadStale ? '路况 ' : ''}不是今天更新的，发布前请先更新。</div>}

      <section className="digest-section">
        <div className="digest-section-head"><h2>01 · 天气图</h2><span>8 家雪场滑雪指数</span></div>
        <div className="digest-preview"><div className="digest-scale"><WeatherDigestCard digest={digest} /></div></div>
        <div className="digest-buttons">
          <button className="primary" disabled={busy === 'weather'} onClick={() => exportCard(weatherRef, `滑雪天气通-天气-${digest.date}`)}>{busy === 'weather' ? '生成中…' : '保存 / 分享图片'}</button>
          <button onClick={copyText}>复制文案</button>
        </div>
      </section>

      <section className="digest-section">
        <div className="digest-section-head"><h2>02 · 雪道图</h2><span>新增 / 关闭 / 预计</span></div>
        <div className="digest-preview"><div className="digest-scale"><SnowDigestCard digest={digest} /></div></div>
        <div className="digest-buttons">
          <button className="primary" disabled={busy === 'snow'} onClick={() => exportCard(snowRef, `滑雪天气通-雪道-${digest.date}`)}>{busy === 'snow' ? '生成中…' : '保存 / 分享图片'}</button>
          <button onClick={copyText}>复制文案</button>
        </div>
      </section>

      <section className="digest-section">
        <div className="digest-section-head"><h2>03 · 路况图</h2><span>封路 / 缓行 / 能见度</span></div>
        <div className="digest-preview"><div className="digest-scale"><RoadDigestCard digest={digest} /></div></div>
        <div className="digest-buttons">
          <button className="primary" disabled={busy === 'road'} onClick={() => exportCard(roadRef, `滑雪天气通-路况-${digest.date}`)}>{busy === 'road' ? '生成中…' : '保存 / 分享图片'}</button>
          <button onClick={copyText}>复制文案</button>
        </div>
      </section>

      <section className="digest-section">
        <div className="digest-section-head"><h2>04 · 雪道情报图</h2><span>手动标注汇总 · 每家一行</span></div>
        <div className="digest-preview"><div className="digest-scale"><TrailDigestCard digest={trailDigest} size="3:4" /></div></div>
        <div className="digest-buttons">
          <button className="primary" disabled={busy === 'trail'} onClick={saveTrailDigest}>{busy === 'trail' ? '生成中…' : '保存 / 分享图片'}</button>
          <button onClick={() => { window.location.hash = '#/trailposter' }}>大图预览</button>
        </div>
      </section>

      <div className="source-line" style={{ marginTop: 18 }}>
        开发者页面是公开路由 <b>#/dev</b>，不包含账号或密钥。天气图每次刷新；雪道为你手动录入（浏览器本地保存），路况为人工整理。<br />
        手机录入雪道：<a className="dev-edit-link" href="#/trails">#/trails</a>；出图：<a className="dev-edit-link" href="#/trailposter">#/trailposter</a>。<br />
        雪道清单来源：{TRAIL_SOURCES}
      </div>

      <div className="export-stage" aria-hidden="true">
        <WeatherDigestCard ref={weatherRef} digest={digest} />
        <SnowDigestCard ref={snowRef} digest={digest} />
        <RoadDigestCard ref={roadRef} digest={digest} />
        <PosterCard ref={posterRef} data={posterData} settings={posterSettings} single={posterSingle} />
        <TrailDigestCard ref={trailRef} digest={trailDigest} size="3:4" />
      </div>

      {toast && <div className="dev-toast">{toast}</div>}
    </main>
  )
}

const TRAIL_SOURCES = '各雪场 2026-27 雪季官方雪道图与公开雪道参数表'
