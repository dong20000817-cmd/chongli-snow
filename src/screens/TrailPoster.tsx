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
  TRAIL_TOTAL,
  emptyDay,
  loadBook,
  trailPosterFilename,
  type TrailBook,
} from '../lib/trails'

const SIZE_KEY = 'ski:trail-poster-size:v2'
const EXCLUDE_KEY = 'ski:trail-poster-exclude:v1'

function loadExclude(): string[] {
  try {
    const raw = localStorage.getItem(EXCLUDE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function TrailPosterScreen({ snapshot, onBack }: { snapshot: Snapshot; onBack: () => void }) {
  const [book, setBook] = useState<TrailBook | null>(null)
  const [size, setSize] = useState<'3:4' | '9:16'>(() => {
    try {
      return localStorage.getItem(SIZE_KEY) === '9:16' ? '9:16' : '3:4'
    } catch {
      return '3:4'
    }
  })
  const [exclude, setExclude] = useState<string[]>(loadExclude)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [scale, setScale] = useState(0.62)
  const [cardH, setCardH] = useState(720)

  const wrapRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loaded = loadBook(snapshot.today)
    setBook(loaded.book)
  }, [snapshot.today])

  useEffect(() => {
    try {
      localStorage.setItem(SIZE_KEY, size)
    } catch { /* ignore */ }
  }, [size])

  useEffect(() => {
    try {
      localStorage.setItem(EXCLUDE_KEY, JSON.stringify(exclude))
    } catch { /* ignore */ }
  }, [exclude])

  useLayoutEffect(() => {
    const measure = () => {
      const w = wrapRef.current?.clientWidth ?? 0
      if (w > 0) setScale(Math.min(1, w / 540))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [size])

  const day = useMemo(() => book?.days[snapshot.today] ?? emptyDay(snapshot.today), [book, snapshot.today])
  const time = day.updatedAt.slice(11, 16) || snapshot.generatedAt.slice(11, 16) || '07:30'
  const full = useMemo(
    () => (book ? buildTrailDigest(book, day, snapshot.today, time) : null),
    [book, day, snapshot.today, time],
  )
  const digest = useMemo(
    () => (book ? buildTrailDigest(book, day, snapshot.today, time, exclude) : null),
    [book, day, snapshot.today, time, exclude],
  )

  // 内容多时画布会自动加长，这里量出真实高度
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const update = () => setCardH(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [digest, size, book])

  const flash = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 3200)
  }

  const toggleResort = (id: string) => {
    setExclude(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  const save = async () => {
    if (!cardRef.current || busy || !digest) return
    setBusy(true)
    try {
      const h = cardRef.current.offsetHeight
      const result = await exportPosterImage(cardRef.current, trailPosterFilename(digest, size, h), '滑雪天气通 · 雪道情报')
      if (result === 'shared') flash('已打开系统分享 · 点「存储图像」进相册')
      else if (result === 'downloaded') flash('已下载 PNG · 可在「文件」里长按存相册')
    } catch {
      flash('导出失败，请重试或截图保存')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen tp-screen">
      <div className="tr-head">
        <button className="dev-back" onClick={onBack} aria-label="返回录入"><Icon name="back" size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tr-title">雪道情报图</div>
          <div className="tr-sub">{day.date.slice(5).replace('-', '/')} · 已开放 {digest?.openedTotal ?? 0} 条 · 今日变化 {digest?.markedTrails ?? 0} 条</div>
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
              {s === '3:4' ? '3:4 · 内容多自动加长' : '9:16 · 内容多自动加长'}
            </button>
          ))}
        </div>
        <a className="tp-edit" href="#/trails">继续录入 →</a>
      </div>

      <div className="tp-preview" ref={wrapRef}>
        <div className="tp-frame" style={{ width: 540 * scale, height: cardH * scale }}>
          <div className="tp-scale" style={{ transform: `scale(${scale})` }}>
            {digest && <TrailDigestCard ref={previewRef} digest={digest} size={size} />}
          </div>
        </div>
      </div>

      {full && full.rows.length > 0 && (
        <div className="tp-picker">
          <div className="tp-picker-head">
            <span>参与情报图的雪场</span>
            <span>点一下可移除 / 加回</span>
          </div>
          <div className="tp-picker-chips">
            {full.rows.map(row => {
              const on = !exclude.includes(row.resort.id)
              return (
                <button key={row.resort.id} className={`tp-pick${on ? ' on' : ''}`} onClick={() => toggleResort(row.resort.id)}>
                  {row.resort.short}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="tp-counts">
        {STATUS_ORDER.map(s => (
          <div className="tp-count" key={s} style={{ '--sc': STATUS_META[s].color } as CSSProperties}>
            <i />
            <small>{STATUS_META[s].label}</small>
            <b>{digest?.totals[s] ?? 0}</b>
          </div>
        ))}
      </div>

      {digest && !digest.anyMarks && (
        <div className="advice" style={{ marginTop: 10 }}>
          <b>还没有内容：</b>先去每家雪场点“全部开放”，再把补雪、训练、临时关闭的雪道点掉，图里就会有内容。
        </div>
      )}

      <div className="tp-save">
        <button className="primary" onClick={save} disabled={busy}>{busy ? '生成中…' : '保存到相册'}</button>
      </div>

      <div className="source-line" style={{ marginTop: 14 }}>
        雪道清单来自 {TRAILS.season} 雪季各雪场官方雪道图与公开雪道参数，共 {TRAIL_TOTAL} 条；状态为你在 <a className="dev-link" href="#/trails">#/trails</a> 里的人工标注。
      </div>

      {digest && (
        <div className="trail-export-stage" aria-hidden="true">
          <TrailDigestCard ref={cardRef} digest={digest} size={size} />
        </div>
      )}

      {toast && <div className="dev-toast">{toast}</div>}
    </main>
  )
}
