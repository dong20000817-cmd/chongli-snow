import { Icon } from './Icons'

export type ModuleTab = 'weather' | 'road' | 'snow'

interface TabBarProps {
  active: ModuleTab
  onTab: (tab: ModuleTab) => void
  onContext: () => void
  contextLabel: string
}

const TABS: Array<{ id: ModuleTab; label: string; icon: 'sun' | 'road' | 'trail' }> = [
  { id: 'weather', label: '天气', icon: 'sun' },
  { id: 'road', label: '路况', icon: 'road' },
  { id: 'snow', label: '雪道', icon: 'trail' },
]

export function TabBar({ active, onTab, onContext, contextLabel }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="模块切换">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`tab${active === t.id ? ' on' : ''}`}
          onClick={() => onTab(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
        >
          <Icon name={t.icon} size={19} />
          <span>{t.label}</span>
        </button>
      ))}
      <span className="tab-sep" />
      <button className="tab-ham" aria-label={contextLabel} onClick={onContext}>
        <i /><i /><i />
      </button>
    </nav>
  )
}
