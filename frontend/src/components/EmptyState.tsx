import { CircleAlert } from './Icons'

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty">
      <CircleAlert size={20} />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  )
}
