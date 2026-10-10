import { RefreshCw } from './Icons'

export function Topbar({
  title,
  subtitle,
  onRefresh,
  loading,
}: {
  title: string
  subtitle: string
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">NOVA / CONTROL PLANE</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <span className="live-dot">
          <i /> Live
        </span>
        <button className="icon-button" onClick={onRefresh} title="Обновить">
          <RefreshCw size={17} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </header>
  )
}
