import { useState, type ComponentType } from 'react'
import { Bot, Boxes, LayoutDashboard, MessageSquareText, Settings2, Users } from './Icons'
import { NovaSymbol } from './NovaLogo'

type Page = 'overview' | 'agents' | 'vms' | 'journal' | 'team'

export function Sidebar({
  page,
  onNavigate,
  userName,
}: {
  page: Page
  onNavigate: (p: Page) => void
  userName: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const items: [Page, string, ComponentType<{ size?: number }>][] = [
    ['overview', 'Обзор', LayoutDashboard],
    ['agents', 'AI-команда', Bot],
    ['vms', 'Инфраструктура', Boxes],
    ['journal', 'Журнал', MessageSquareText],
    ['team', 'Команда', Users],
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark-symbol">
          <NovaSymbol size={32} />
        </div>
        <div className="brand-copy">
          <strong>nova</strong>
          <span>AI operations</span>
        </div>
      </div>
      <nav>
        {items.map(([key, label, Icon]) => (
          <button
            key={key}
            className={page === key ? 'active' : ''}
            onClick={() => onNavigate(key)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button onClick={() => onNavigate('team')}>
          <Settings2 size={18} />
          <span>Настройки</span>
        </button>
        <div className="user-chip">
          <div className="avatar">Ф</div>
          <div>
            <strong>{userName}</strong>
            <span>Staff</span>
          </div>
        </div>
      </div>
      <button className="collapse" onClick={() => setCollapsed(v => !v)}>
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  )
}

export type { Page }
