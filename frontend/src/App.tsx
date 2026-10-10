import { useState, useEffect } from 'react'
import { LandingPage } from './pages/LandingPage'
import { ConstructorModal } from './pages/ConstructorModal'
import { Overview } from './pages/Overview'
import { Agents } from './pages/Agents'
import { Infrastructure } from './pages/Infrastructure'
import { Journal } from './pages/Journal'
import { Team } from './pages/Team'
import { Login } from './pages/Login'
import { Sidebar, type Page } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { api, getToken, clearToken, type Agent, type User, type Vm } from './lib/api'
import './styles.css'

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  // Конструктор в модальном окне поверх основного контента
  const [builderModalOpen, setBuilderModalOpen] = useState(false)
  const [builderSelectedProductId, setBuilderSelectedProductId] = useState<string | undefined>()

  const [page, setPage] = useState<Page>('overview')
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [vms, setVms] = useState<Vm[]>([])
  const [, setError] = useState('')

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) {
        setAuthLoading(false)
        return
      }
      try {
        const me = await api.me()
        setUser(me)
      } catch {
        clearToken()
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }
    bootstrap()
  }, [])

  const loadAdminData = async () => {
    if (!user?.is_staff) return
    setDataLoading(true)
    setError('')
    try {
      const us = await api.users().catch(() => [])
      setUsers(Array.isArray(us) ? us : [])

      const ag = await api.agents(user.id).catch(() => [])
      setAgents(Array.isArray(ag) ? ag : [])

      const vmResults = await Promise.all(
        ['active', 'restarting', 'disabled', 'creating', 'error'].map(s =>
          api.vmsByStatus(s).catch(() => [])
        )
      )
      const allVms = vmResults.flat()
      setVms(allVms.filter((v, i, a) => a.findIndex(x => x.id === v.id) === i))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (pathname === '/admin' && user?.is_staff) {
      loadAdminData()
    }
  }, [pathname, user])

  // Главная страница с модальным окном конструктора поверх основного контента
  if (pathname !== '/admin') {
    return (
      <div className="site-wrapper">
        <LandingPage
          onStartBuilder={productId => {
            setBuilderSelectedProductId(productId)
            setBuilderModalOpen(true)
          }}
        />

        {builderModalOpen && (
          <ConstructorModal
            initialProductId={builderSelectedProductId}
            onClose={() => setBuilderModalOpen(false)}
          />
        )}
      </div>
    )
  }

  // Роут админ-панели /admin
  if (authLoading) {
    return (
      <main className="auth-shell">
        <div className="auth-loading">Проверка доступа…</div>
      </main>
    )
  }

  if (!user) {
    return (
      <Login
        onLoggedIn={async () => {
          const me = await api.me()
          setUser(me)
        }}
      />
    )
  }

  if (!user.is_staff) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Доступ закрыт</h1>
          <p className="auth-copy">Панель доступна только администраторам.</p>
          <button
            className="secondary-button"
            onClick={() => {
              window.history.pushState({}, '', '/')
              setPathname('/')
            }}
          >
            На главную
          </button>
        </section>
      </main>
    )
  }

  const titles: Record<Page, [string, string]> = {
    overview: ['Обзор', 'Сводка по состоянию AI-команды'],
    agents: ['AI-команда', 'Реестр агентов'],
    vms: ['Инфраструктура', 'Виртуальные машины'],
    journal: ['Журнал', 'Аудит подключений'],
    team: ['Команда', 'Пользователи и права доступа'],
  }

  return (
    <div className="app">
      <Sidebar page={page} onNavigate={setPage} userName={user.name} />
      <main className="main">
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
          <button
            className="secondary-button"
            onClick={() => {
              window.history.pushState({}, '', '/')
              setPathname('/')
            }}
          >
            ← На главную страницу
          </button>
        </div>
        <Topbar
          title={titles[page][0]}
          subtitle={titles[page][1]}
          onRefresh={loadAdminData}
          loading={dataLoading}
        />
        {page === 'overview' && (
          <Overview
            agents={agents}
            vms={vms}
            onOpenAgents={() => setPage('agents')}
            onOpenVms={() => setPage('vms')}
          />
        )}
        {page === 'agents' && (
          <Agents
            agents={agents}
            vms={vms}
            userId={user.id}
            onCreated={a => setAgents(prev => [a, ...prev])}
          />
        )}
        {page === 'vms' && (
          <Infrastructure vms={vms} onCreated={v => setVms(prev => [v, ...prev])} />
        )}
        {page === 'journal' && <Journal vms={vms} />}
        {page === 'team' && (
          <Team
            users={users}
            currentUserId={user.id}
            onCreated={u => setUsers(prev => [u, ...prev])}
            onUpdated={u => setUsers(prev => prev.map(x => (x.id === u.id ? u : x)))}
          />
        )}
      </main>
    </div>
  )
}
