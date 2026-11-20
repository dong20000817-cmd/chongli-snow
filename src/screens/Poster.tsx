import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Snapshot } from '../lib/types'
import { RESORTS } from '../data/resorts'
import {
  buildPosterData,
  defaultSettings,
  defaultSubtitle,
  loadPosterSettings,
  posterFilename,
  posterTitle,
  resortsForScope,
  savePosterSettings,
} from '../lib/poster'
import type { PosterLayout, PosterRow, PosterScope, PosterSettings, PosterShow, PosterSize, PosterTheme } from '../lib/poster'
import { PosterCard } from '../components/PosterCard'
import { Icon } from '../components/Icons'
import { exportPosterImage } from '../lib/export'

type Tab = 'content' | 'style' | 'text'

const LAYOUTS: Array<{ id: PosterLayout; label: string }> = [
  { id: 'grid', label: '双列' },
  { id: 'list', label: '榜单' },
  { id: 'single', label: '单雪场' },
]

const THEMES: Array<{ id: PosterTheme; label: string; css: string }> = [
  { id: 'night', label: '雪夜', css: 'linear-gradient(160deg,#2d6d9e,#0a2744)' },
  { id: 'dawn', label: '晨光', css: 'linear-gradient(160deg,#c98558,#2a2036)' },
  { id: 'fog', label: '雾雪', css: 'linear-gradient(160deg,#8ea4b2,#354552)' },
]

const SHOW_LABELS: Array<{ id: keyof PosterShow; label: string }> = [
  { id: 'temp', label: '山顶温度' },
  { id: 'wind', label: '风级' },
  { id: 'vis', label: '能见度' },
  { id: 'feels', label: '体感' },
]

export function PosterScreen({ snapshot, resortId, onBack }: {
  snapshot: Snapshot
  resortId: string
  onBack: () => void
}) {
  const [settings, setSettings] = useState<PosterSettings>(() => loadPosterSettings(snapshot))
  const [tab, setTab] = useState<Tab>('content')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftIds, setDraftIds] = useState<string[]>([])

  const panelRef = useRef<HTMLDivElement>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => buildPosterData(snapshot, settings), [snapshot, settings])
  const singleRow: PosterRow = data.rows.find(r => r.resort.id === resortId) ?? data.best
  const hasCurrentResort = data.rows.some(r => r.resort.id === resortId)

  useEffect(() => {
    savePosterSettings(settings)
  }, [settings])

  const showToast = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 3200)
  }

  const [previewH, setPreviewH] = useState(400)

  useLayoutEffect(() => {
    const measure = () => {
      const panel = panelRef.current
      const wrap = previewWrapRef.current
      if (!panel || !wrap) return
      const available = panel.getBoundingClientRect().top - wrap.getBoundingClientRect().top - 12
      setPreviewH(Math.max(200, Math.min(430, available)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [settings.size])

  const previewW = previewH * (settings.size === '3:4' ? 0.75 : 9 / 16)
  const scale = previewW / 540

  const updateScope = (scope: PosterScope, ids = settings.customIds) => {
    setSettings(s => {
      const oldRows = resortsForScope(snapshot, s.scope, s.customIds)
      const newRows = resortsForScope(snapshot, scope, ids)
      const oldSub = defaultSubtitle(s.scope, oldRows)
      return {
        ...s,
        scope,
        customIds: ids,
        subtitle: s.subtitle === oldSub ? defaultSubtitle(scope, newRows) : s.subtitle,
      }
    })
  }

  const setDay = (day: 0 | 1) => {
    setSettings(s => ({
      ...s,
      day,
      title: s.title === posterTitle(s.day) ? posterTitle(day) : s.title,
    }))
  }

  const toggleShow = (key: keyof PosterShow) => {
    setSettings(s => ({ ...s, show: { ...s.show, [key]: !s.show[key] } }))
  }

  const openPicker = () => {
    const current = settings.scope === 'custom'
      ? settings.customIds
      : settings.scope === 'chongli'
        ? resortsForScope(snapshot, 'chongli', []).map(r => r.id)
        : RESORTS.map(r => r.id)
    setDraftIds(current.length ? current : RESORTS.map(r => r.id))
    setPickerOpen(true)
  }

  const toggleDraft = (id: string) => {
    setDraftIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  const confirmPicker = () => {
    if (!draftIds.length) return
    updateScope('custom', draftIds)
    setPickerOpen(false)
  }

  const reset = () => {
    setSettings(defaultSettings(snapshot))
    setTab('content')
    showToast('已恢复默认设置')
  }

  const save = async () => {
    if (!exportRef.current || busy) return
    setBusy(true)
    try {
      const result = await exportPosterImage(exportRef.current, posterFilename(settings, data), '滑雪天气通 · 天气概览图')
      if (result === 'shared') showToast('已打开系统分享 · 点「存储图像」进相册')
      else if (result === 'downloaded') showToast('已下载 PNG · 可在「文件」里长按存相册')
    } catch {
      showToast('导出失败，请重试或截图保存')
    } finally {
      setBusy(false)
    }
  }

  const layoutLabel = LAYOUTS.find(l => l.id === settings.layout)?.label ?? '双列'

  return (
    <main className="poster-screen">
      <div className="poster-nav">
        <button className="poster-back" onClick={onBack} aria-label="返回">
          <Icon name="back" size={16} />
        </button>
        <div className="poster-nav-main">
          <h1>天气概览图</h1>
          <p>每天 07:30 · 微调后保存到相册</p>
        </div>
        <button className="poster-reset" onClick={reset}>重置</button>
      </div>

      <div className="poster-preview-wrap" ref={previewWrapRef} style={{ height: previewH }}>
        <div className="poster-preview-frame" style={{ width: previewW, height: previewH }}>
          <div
            className="poster-preview-scale"
            style={{
              width: 540,
              height: settings.size === '3:4' ? 720 : 960,
              transform: `scale(${scale})`,
            }}
          >
            <PosterCard data={data} settings={settings} single={singleRow} />
          </div>
        </div>
      </div>

      <div className="poster-panel" ref={panelRef}>
        <div className="poster-panel-grab" />
        <div className="poster-panel-head">
          <b>微调</b>
          <span>
            <i className="live-dot" />
            实时预览 · {data.rows.length} 家 · {settings.size === '3:4' ? '3:4' : '9:16'}
          </span>
        </div>
        <div className="poster-tabs">
          <button className={tab === 'content' ? 'on' : ''} onClick={() => setTab('content')}>内容</button>
          <button className={tab === 'style' ? 'on' : ''} onClick={() => setTab('style')}>版式</button>
          <button className={tab === 'text' ? 'on' : ''} onClick={() => setTab('text')}>文字</button>
        </div>

        <div className="poster-panel-body">
          {tab === 'content' && (
            <>
              <div className="poster-ctl">
                <div className="poster-ctl-head"><span>日期</span><b>{settings.day === 0 ? '今天' : '明天'} · {data.dateLabel}</b></div>
                <div className="poster-seg">
                  <button className={settings.day === 0 ? 'on' : ''} onClick={() => setDay(0)}>今天</button>
                  <button className={settings.day === 1 ? 'on' : ''} onClick={() => setDay(1)}>明天</button>
                </div>
              </div>
              <div className="poster-ctl">
                <div className="poster-ctl-head"><span>雪场范围</span><b>{data.rows.length} 家</b></div>
                <div className="poster-seg">
                  <button className={settings.scope === 'all' ? 'on' : ''} onClick={() => updateScope('all')}>全部</button>
                  <button className={settings.scope === 'chongli' ? 'on' : ''} onClick={() => updateScope('chongli')}>崇礼 7 家</button>
                  <button className={settings.scope === 'custom' ? 'on' : ''} onClick={openPicker}>
                    自选{settings.scope === 'custom' ? ` ${settings.customIds.length}` : ''}
                  </button>
                </div>
              </div>
              <div className="poster-ctl">
                <div className="poster-ctl-head">
                  <span>显示指标</span>
                  <b>{SHOW_LABELS.filter(x => settings.show[x.id]).length} 项</b>
                </div>
                <div className="poster-chips">
                  {SHOW_LABELS.map(x => (
                    <button key={x.id} className={settings.show[x.id] ? 'on' : ''} onClick={() => toggleShow(x.id)}>
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'style' && (
            <>
              <div className="poster-ctl">
                <div className="poster-ctl-head"><span>版式</span><b>{layoutLabel}</b></div>
                <div className="poster-layout-row">
                  {LAYOUTS.map(l => (
                    <button
                      key={l.id}
                      className={`poster-layout${settings.layout === l.id ? ' on' : ''}`}
                      onClick={() => setSettings(s => ({ ...s, layout: l.id }))}
                    >
                      <span className={`poster-dia ${l.id}`}>
                        <i /><i /><i /><i />
                      </span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
                {settings.layout === 'single' && (
                  <div className="poster-note">单雪场版使用：{singleRow.resort.short}{!hasCurrentResort ? '（当前雪场不在范围，已用最高分）' : ''}</div>
                )}
              </div>
              <div className="poster-ctl">
                <div className="poster-ctl-head"><span>主题</span><b>{THEMES.find(t => t.id === settings.theme)?.label}</b></div>
                <div className="poster-theme-row">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`poster-theme${settings.theme === t.id ? ' on' : ''}`}
                      onClick={() => setSettings(s => ({ ...s, theme: t.id }))}
                    >
                      <i style={{ background: t.css }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="poster-ctl">
                <div className="poster-ctl-head"><span>尺寸</span><b>{settings.size === '3:4' ? '1080×1440' : '1080×1920'}</b></div>
                <div className="poster-size-row">
                  {(['3:4', '9:16'] as PosterSize[]).map(s => (
                    <button
                      key={s}
                      className={settings.size === s ? 'on' : ''}
                      onClick={() => setSettings(v => ({ ...v, size: s }))}
                    >
                      {s === '3:4' ? '3:4 小红书' : '9:16 故事'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'text' && (
            <>
              <label className="poster-field">
                <span>主标题 <small>最多 12 字</small></span>
                <input
                  value={settings.title}
                  maxLength={12}
                  onChange={e => setSettings(s => ({ ...s, title: e.target.value }))}
                />
              </label>
              <label className="poster-field">
                <span>副标题 <small>最多 28 字</small></span>
                <input
                  value={settings.subtitle}
                  maxLength={28}
                  onChange={e => setSettings(s => ({ ...s, subtitle: e.target.value }))}
                />
              </label>
              <label className="poster-field">
                <span>署名 <small>小红书号 / 昵称</small></span>
                <input
                  value={settings.handle}
                  maxLength={16}
                  onChange={e => setSettings(s => ({ ...s, handle: e.target.value }))}
                />
              </label>
              <div className="poster-toggle-row">
                <button className={settings.footnote ? 'on' : ''} onClick={() => setSettings(s => ({ ...s, footnote: !s.footnote }))}>
                  <span className="poster-check">{settings.footnote ? '✓' : ''}</span>
                  数据脚注
                </button>
                <button className={settings.updated ? 'on' : ''} onClick={() => setSettings(s => ({ ...s, updated: !s.updated }))}>
                  <span className="poster-check">{settings.updated ? '✓' : ''}</span>
                  更新时间
                </button>
              </div>
            </>
          )}
        </div>

        <button className="poster-save" disabled={busy} onClick={save}>
          <Icon name="download" size={15} />
          {busy ? '生成中…' : '保存到相册'}
        </button>
        <div className={`poster-hint${toast ? ' poster-hint-toast' : ''}`}>
          {toast ?? `${settings.size === '3:4' ? '1080×1440' : '1080×1920'} · Safari 分享 →「存储图像」进相册`}
        </div>
      </div>

      <div className="poster-export-stage" aria-hidden="true">
        <PosterCard ref={exportRef} data={data} settings={settings} single={singleRow} />
      </div>

      {pickerOpen && (
        <div className="poster-picker-mask" onClick={() => setPickerOpen(false)}>
          <div className="poster-picker" onClick={e => e.stopPropagation()}>
            <div className="poster-picker-head">
              <b>自选雪场</b>
              <span>{draftIds.length} / {RESORTS.length}</span>
            </div>
            <div className="poster-picker-list">
              {RESORTS.map(meta => {
                const resort = snapshot.resorts[meta.id]
                if (!resort) return null
                const checked = draftIds.includes(meta.id)
                return (
                  <button key={meta.id} className={`poster-picker-row${checked ? ' on' : ''}`} onClick={() => toggleDraft(meta.id)}>
                    <span className="poster-picker-check">{checked ? '✓' : ''}</span>
                    <span className="poster-picker-main">
                      <b>{resort.short}</b>
                      <small>{resort.region} · {resort.area.split(' · ')[0]}</small>
                    </span>
                  </button>
                )
              })}
            </div>
            <button className="poster-picker-done" disabled={!draftIds.length} onClick={confirmPicker}>
              {draftIds.length ? `完成 · 已选 ${draftIds.length} 家` : '至少选 1 家'}
            </button>
          </div>
        </div>
      )}

    </main>
  )
}
