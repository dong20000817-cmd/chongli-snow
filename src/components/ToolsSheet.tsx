import { useState } from 'react'
import type { IconName } from './Icons'
import { Icon } from './Icons'
import { BottomSheet, SheetClose, SheetHandle } from './Common'
import { buildLabel, checkForUpdate } from '../lib/update'

const TOOLS: Array<{ href: string; icon: IconName; title: string; sub: string; accent: string }> = [
  { href: '#/poster', icon: 'image', title: '天气概览图', sub: '版式 / 主题微调后存相册', accent: '#5AC8FA' },
  { href: '#/trails', icon: 'trail', title: '雪道录入', sub: '今天新开 / 补雪 / 训练 / 关闭', accent: '#00E5C0' },
  { href: '#/trailposter', icon: 'chart', title: '雪道情报图', sub: '3:4 / 9:16 每日摘要', accent: '#B78BFF' },
  { href: '#/dev', icon: 'sparkle', title: '开发者简报', sub: '四张图 + 一段小红书文案', accent: '#0A84FF' },
]

export function ToolsSheet({ resortId, onClose }: { resortId: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const check = async () => {
    if (busy) return
    setBusy(true)
    setMsg('正在检查…')
    const r = await checkForUpdate()
    setBusy(false)
    setMsg(r === 'updated' ? '发现新版本，正在刷新…' : r === 'latest' ? '已是最新版本' : '当前浏览器不支持自动更新，手动下拉刷新即可')
  }

  return (
    <BottomSheet onClose={onClose} label="所有工具">
      <SheetHandle />
      <div className="sheet-head">
        <div>
          <div className="sheet-title">所有工具</div>
          <div className="sheet-sub">一个网址装下全部入口 · 部署后原地更新</div>
        </div>
        <SheetClose onClose={onClose} />
      </div>

      <div className="tools-list">
        {TOOLS.map(t => (
          <a
            key={t.href}
            className="tool-row"
            href={t.href === '#/trails' ? `#/trails/${resortId}` : t.href}
            onClick={onClose}
          >
            <span className="tool-ico" style={{ color: t.accent, background: `${t.accent}1f`, border: `1px solid ${t.accent}33` }}>
              <Icon name={t.icon} size={16} />
            </span>
            <span className="tool-main">
              <span className="tool-title">{t.title}</span>
              <span className="tool-sub">{t.sub}</span>
            </span>
            <Icon name="chevron" size={13} className="tool-arrow" />
          </a>
        ))}
      </div>

      <div className="tools-version">
        <div>
          <b>版本 {buildLabel()}</b>
          <small>每次部署都更新这个站，不会换网址</small>
        </div>
        <button onClick={check} disabled={busy}>{busy ? '检查中' : '检查更新'}</button>
      </div>
      {msg && <div className="tools-msg">{msg}</div>}
      <div className="sheet-foot">固定地址 dong20000817-cmd.github.io/chongli-snow</div>
    </BottomSheet>
  )
}
