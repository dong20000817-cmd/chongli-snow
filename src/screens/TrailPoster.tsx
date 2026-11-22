import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Snapshot } from '../lib/types'
import { Icon } from '../components/Icons'
import { TrailDigestCard } from '../components/TrailDigestCard'
import { exportPosterImage } from '../lib/export'
import {
  STATUS_META,
  STATUS_ORDER,
  TRAILS,
  buildTrailDigest,
  emptyDay,
  loadBook,
  trailPosterFilename,
  type TrailDay,
} from '../lib/trails'

const SIZE_KEY = 'ski:trail-poster-size:v1'

export function TrailPosterScreen({ snapshot, onBack }: { snapshot: Snapshot; onBack: () => void }) {
  const [day, setDay] = useState<TrailDay>(() => emptyDay(snapshot.today))
  const [size, setSize] = useState<'3:4' | '9:16'>(() => {
    try {
      return localStorage.getItem(SIZE_KEY) === '9:16' ? '9:16' : '3:4'
    } catch {
      return '3:4'
    }
  })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [scale, setScale] = useState(0.62)

  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDay(loadBook(snapshot.today).day)
  }, [snapshot.today])

  useEffect(() => {
    try {
      localStorage.setItem(SIZE_KEY, size)
    } catch {
      /* ignore */
    }
  }, [size])

  useLayoutEffect(() => {
    const measure = () => {
      const w = wrapRef.current?.clientWidth ?? 0
      if (w > 0) setScale(Math.min(1, w / 540))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [size])

  const digest = useMemo(
    () => buildTrailDigest(day, snapshot.today, snapshot.generatedAt.slice(11, 16) || '07:30'),
    [day, snapshot.today, snapshot.generatedAt],
  )

  const flash = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 3200)
  }

  const save = async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const result = await exportPosterImage(cardRef.current, trailPosterFilename(digest, size), '滑雪天气通 · 雪道情报')
      if (result === 'shared') flash('已打开系统分享 · 点「存储图像」进相册')
      else if (result === 'downloaded') flash('已下载 PNG · 可在「文件」里长按存相册')
    } catch {
      flash('导出失败，请重试或截图保存')
    } finally {
      setBusy(false)
    }
  }

  const cardW = 540
  const cardH = size === '3:4' ? 720 : 960

  return (
    <main className="screen tp-screen">
      <div className="tr-head">
        <button className="dev-back" onClick={onBack} aria-label="返回录入"><Icon name="back" size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tr-title">雪道情报图</div>
          <div className="tr-sub">{digest.dateLabel} · 已录 {digest.markedResorts}/8 家 · {digest.markedTrails} 条标注</div>
        </div>
        <button className="refresh-btn" onClick={save} disabled={busy}>
          <Icon name="download" size={12} />
          <span>{busy ? '生成中' : '保存'}</span>
        </button>
      </div>

      <div className="tp-controls">
        <div className="tp-seg">
          {(['3:4', '9:16'] as const).map(s => (
            <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>
              {s === '3:4' ? '3:4 · 1080×1440' : '9:16 · 1080×1920'}
            </button>
          ))}
        </div>
        <a className="tp-edit" href="#/trails">继续录入 →</a>
      </div>

      <div className="tp-preview" ref={wrapRef}>
        <div className="tp-frame" style={{ width: cardW * scale, height: cardH * scale }}>
          <div className="tp-scale" style={{ transform: `scale(${scale})` }}>
            <TrailDigestCard digest={digest} size={size} />
          </div>
        </div>
      </div>

      <div className="tp-counts">
        {STATUS_ORDER.map(s => (
          <div className="tp-count" key={s} style={{ '--sc': STATUS_META[s].color } as CSSProperties}>
            <i />
            <small>{STATUS_META[s].label}</small>
            <b>{digest.totals[s]}</b>
          </div>
        ))}
      </div>

      {!digest.anyMarks && (
        <div className="advice" style={{ marginTop: 10 }}>
          <b>还没有标注：</b>先去每家雪场点“全部开放”，再把补雪、训练、临时关闭的雪道点掉，图里就会有内容。
        </div>
      )}

      <div className="tp-save">
        <button className="primary" onClick={save} disabled={busy}>{busy ? '生成中…' : '保存到相册'}</button>
      </div>

      <div className="source-line" style={{ marginTop: 14 }}>
        雪道清单来自 {TRAILS.season} 雪季各雪场官方雪道图与公开雪道参数，共 {digest.totalTrails} 条；状态为你在 <a className="dev-link" href="#/trails">#/trails</a> 里的人工标注，不是官方实时 API。
      </div>

      <div className="trail-export-stage" aria-hidden="true">
        <TrailDigestCard ref={cardRef} digest={digest} size={size} />
      </div>

      {toast && <div className="dev-toast">{toast}</div>}
    </main>
  )
}
