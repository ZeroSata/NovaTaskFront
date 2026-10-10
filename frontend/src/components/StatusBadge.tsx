import type { VmStatus } from '../lib/api'

export function StatusBadge({ status }: { status: VmStatus }) {
  const labels: Record<VmStatus, string> = {
    ACTIVE: 'Активна',
    RESTARTING: 'Перезапуск',
    DISABLED: 'Отключена',
    CREATING: 'Создаётся',
    ERROR: 'Ошибка',
  }
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <i />
      {labels[status]}
    </span>
  )
}

export function PermissionBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    smm: 'SMM',
    methodologist: 'Методолог',
    analyst: 'Аналитик',
  }
  return <span className="permission">{labels[value] ?? value}</span>
}
