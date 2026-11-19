import { useMemo, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import type { Snapshot } from '../lib/types'
import { buildDigest } from '../lib/digest'
import { SNOW_DATA, ROAD_DATA, isToday } from '../lib/status'
import { WeatherDigestCard, SnowDigestCard, RoadDigestCard } from '../components/DigestCards'
import { Icon } from '../components/Icons'

export function DevPage({ snapshot, resortId, onRefresh, refreshing }: {
  snapshot: Snapshot
  resortId: string
  onRefresh: () => void
  refreshing: boolean
}) {
  const digest = useMemo(() => buildDigest(snapshot), [snapshot])
  const weatherRef = useRef<HTMLDivElement>(null)
  const snowRef = useRef<HTMLDivElement>(null)
  const roadRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(digest.text)
      showToast('今日文案已复制')
    } catch {
      showToast('复制失败，请手动选择文案')
    }
  }

  const demo = SNOW_DATA.isDemo || ROAD_DATA.isDemo
  const snowStale = !isToday(SNOW_DATA.updatedAt, snapshot.today)
  const roadStale = !isToday(ROAD_DATA.updatedAt, snapshot.today)
  return (
    <main className="screen dev-screen">
      <div className="dev-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <a className="dev-back" href={`#/home/${resortId}`} aria-label="返回"><Icon name="back" size={16} /></a>
          <div><div className="dev-title">开发者简报</div><div className="dev-sub">每天 07:30 · 三张图 + 一段文案</div></div>
        </div>
        <button className="refresh-btn" onClick={onRefresh} aria-label="刷新天气">
          <Icon name="refresh" size={12} />
          <span>{refreshing ? '更新中' : '刷新'}</span>
        </button>
      </div>

      <div className="list-summary" style={{ background: 'linear-gradient(135deg,rgba(10,132,255,.18),rgba(10,132,255,.04)),rgba(255,255,255,.06)', borderColor: 'rgba(10,132,255,.2)' }}>
        <div className="top">
          <div><div className="k">{digest.isTomorrow ? '明日情报' : '今日情报'}</div><div className="big" style={{ fontSize: 25 }}>{digest.dateLabel}</div></div>
          <div className="summary-side"><b>{digest.weather.length} 家雪场</b>{SNOW_DATA.isDemo ? '雪道示例 · ' : ''}{ROAD_DATA.isDemo ? '路况示例' : '路况已接入'}</div>
        </div>
        <div className="desc">天气、雪道、路况三张卡片已按 3:4 生成，适合小红书竖版发布。图片为 1080×1440。</div>
        <div className="meta">天气快照 {snapshot.generatedAt.slice(11, 16)} · 雪道 {SNOW_DATA.updatedAt.slice(11, 16)} · 路况 {ROAD_DATA.updatedAt.slice(11, 16)}</div>
      </div>

      <div className="dev-actions">
        <button className="primary" onClick={copyText}>复制文案</button>
        <button onClick={() => exportCard(weatherRef, `滑雪天气通-天气-${digest.date}`)}>只存天气图</button>
      </div>

      {demo && <div className="advice" style={{ marginTop: 10 }}><b>数据提醒：</b>雪道/路况当前为演示数据，发布前请更新官方信息；天气为实时预报。</div>}
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

      <div className="source-line" style={{ marginTop: 18 }}>
        开发者页面是公开路由 <b>#/dev</b>，不包含账号或密钥。天气图每次刷新；雪道/路况为人工整理，更新后重新生成三张图。<br />
        发布前请确认雪道/路况来源为官方，图片中的“示例数据”标记在正式数据接入后自动消失。<br />
        手机更新数据：<a className="dev-edit-link" href="https://github.com/dong20000817-cmd/chongli-snow/edit/main/src/data/snow.json" target="_blank" rel="noopener">编辑 snow.json</a> · <a className="dev-edit-link" href="https://github.com/dong20000817-cmd/chongli-snow/edit/main/src/data/road.json" target="_blank" rel="noopener">编辑 road.json</a>，保存后等 GitHub Actions 自动发布。
      </div>

      <div className="export-stage" aria-hidden="true">
        <WeatherDigestCard ref={weatherRef} digest={digest} />
        <SnowDigestCard ref={snowRef} digest={digest} />
        <RoadDigestCard ref={roadRef} digest={digest} />
      </div>

      {toast && <div className="dev-toast">{toast}</div>}
    </main>
  )
}
