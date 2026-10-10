import { useMemo, useState, type FormEvent } from 'react'
import { Bot, MoreHorizontal, Plus, Search, Server } from 'lucide-react'
import { api, type Agent, type Vm, type AgentPermission } from '../lib/api'
import { PermissionBadge } from '../components/StatusBadge'

export function Agents({
  agents,
  vms,
  userId,
  onCreated,
}: {
  agents: Agent[]
  vms: Vm[]
  userId?: number
  onCreated: (agent: Agent) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permission, setPermission] = useState<AgentPermission>('analyst')
  const [vmId, setVmId] = useState<number>(vms[0]?.id ?? 0)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const filtered = useMemo(
    () =>
      agents.filter(a =>
        (a.agent_name + ' ' + (a.agent_description ?? '')).toLowerCase().includes(q.toLowerCase())
      ),
    [agents, q]
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!userId || !vmId || !name.trim()) return
    setSaving(true)
    setFormError('')
    try {
      const agent = await api.createAgent(userId, {
        agent_name: name.trim(),
        agent_description: description.trim() || null,
        agent_vm_id: vmId,
        agent_permission: permission,
      })
      onCreated(agent)
      setOpen(false)
      setName('')
      setDescription('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось создать агента')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <div>
          <span className="section-label">AI TEAM / REGISTRY</span>
          <h2>AI-агенты</h2>
          <p>Единый реестр исполнителей и их зон ответственности.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setOpen(true)
            setFormError('')
          }}
        >
          <Plus size={17} /> Новый агент
        </button>
      </div>
      <div className="filterbar">
        <div className="search">
          <Search size={16} />
          <input
            placeholder="Поиск по агентам"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <span className="result-count">
          {filtered.length} из {agents.length}
        </span>
      </div>
      <section className="table-panel">
        <div className="table-head">
          <span>АГЕНТ</span>
          <span>РОЛЬ</span>
          <span>VM</span>
          <span>СОЗДАН</span>
          <span />
        </div>
        {filtered.map(a => {
          const vm = vms.find(v => v.id === a.agent_vm_id)
          return (
            <div className="table-row" key={a.id}>
              <div className="identity">
                <div className="agent-avatar">
                  <Bot size={18} />
                </div>
                <div>
                  <strong>{a.agent_name}</strong>
                  <span>{a.agent_description || '—'}</span>
                </div>
              </div>
              <PermissionBadge value={a.agent_permission} />
              <div className="muted">
                <Server size={14} /> {vm?.title ?? `VM #${a.agent_vm_id}`}
              </div>
              <div className="muted">
                {new Date(a.created_at).toLocaleDateString('ru-RU')}
              </div>
              <button className="icon-button ghost">
                <MoreHorizontal size={18} />
              </button>
            </div>
          )
        })}
        {!filtered.length && (
          <div className="empty-table">
            <Bot size={28} />
            <strong>Ничего не найдено</strong>
            <span>Измените запрос или создайте первого агента.</span>
          </div>
        )}
      </section>
      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.currentTarget === e.target && !saving) setOpen(false)
          }}
        >
          <form className="modal" onSubmit={submit}>
            <div className="modal-head">
              <div>
                <span className="section-label">NEW AGENT</span>
                <h3>Создать AI-агента</h3>
              </div>
              <button
                type="button"
                className="icon-button ghost"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <label>
              Название
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например, Аналитик контента"
              />
            </label>
            <label>
              Описание
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Зона ответственности агента"
              />
            </label>
            <div className="form-grid">
              <label>
                Роль
                <select
                  value={permission}
                  onChange={e => setPermission(e.target.value as AgentPermission)}
                >
                  <option value="analyst">Аналитик</option>
                  <option value="methodologist">Методолог</option>
                  <option value="smm">SMM</option>
                </select>
              </label>
              <label>
                VM
                <select
                  required
                  value={vmId}
                  onChange={e => setVmId(Number(e.target.value))}
                >
                  <option value={0} disabled>
                    Выберите VM
                  </option>
                  {vms.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {formError && <div className="error-box">{formError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button
                className="primary-button"
                disabled={saving || !userId || !vmId}
              >
                {saving ? 'Создание…' : 'Создать агента'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
