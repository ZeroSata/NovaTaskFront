import { useMemo, useState, type FormEvent } from 'react'
import { Boxes, Cpu, Database, Plus, Search, Server } from 'lucide-react'
import type { Vm } from '../lib/api'
import { api } from '../lib/api'
import { StatusBadge } from '../components/StatusBadge'

export function Infrastructure({
  vms,
  onCreated,
}: {
  vms: Vm[]
  onCreated: (vm: Vm) => void
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'CREATING' | 'RESTARTING' | 'DISABLED' | 'ERROR'>('all')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cores, setCores] = useState(2)
  const [ram, setRam] = useState(4096)
  const [rom, setRom] = useState(40)
  const [ostype, setOstype] = useState(1)

  const filtered = useMemo(
    () =>
      vms.filter(
        v =>
          (filter === 'all' || v.status === filter) &&
          v.title.toLowerCase().includes(q.toLowerCase())
      ),
    [vms, q, filter]
  )

  function reset() {
    setTitle('')
    setDescription('')
    setCores(2)
    setRam(4096)
    setRom(40)
    setOstype(1)
    setError('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const vm = await api.createVm({
        title: title.trim(),
        description: description.trim() || null,
        cores,
        ram,
        rom,
        ostype,
      })
      onCreated(vm)
      setOpen(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать VM')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <div>
          <span className="section-label">INFRASTRUCTURE / PROXMOX</span>
          <h2>Виртуальные машины</h2>
          <p>Состояние вычислительной инфраструктуры AI-команды.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setOpen(true)
            setError('')
          }}
        >
          <Plus size={17} /> Создать VM
        </button>
      </div>
      <div className="filterbar">
        <div className="search">
          <Search size={16} />
          <input
            placeholder="Поиск VM"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="segmented">
          {[
            ['all', 'Все'],
            ['ACTIVE', 'Активные'],
            ['CREATING', 'Создание'],
            ['ERROR', 'Ошибки'],
          ].map(([k, l]) => (
            <button
              className={filter === k ? 'selected' : ''}
              key={k}
              onClick={() => setFilter(k as typeof filter)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="vm-cards">
        {filtered.map(v => (
          <article className="vm-card" key={v.id}>
            <div className="vm-card-top">
              <div className="vm-symbol">
                <Boxes size={19} />
              </div>
              <StatusBadge status={v.status} />
            </div>
            <h3>{v.title}</h3>
            <p>{v.description || 'Описание не задано'}</p>
            <div className="vm-specs">
              <span>
                <Cpu size={14} />
                {v.cores} CPU
              </span>
              <span>
                <Database size={14} />
                {v.ram} MB
              </span>
              <span>
                <Server size={14} />
                {v.rom} GB
              </span>
            </div>
            <div className="vm-footer">
              <span>{v.ipv4 || 'IP не назначен'}</span>
              <code>#{v.vm_proxmox_id}</code>
            </div>
          </article>
        ))}
        {!filtered.length && (
          <div className="empty-table">
            <Boxes size={28} />
            <strong>VM не найдены</strong>
            <span>API не вернуло виртуальные машины с выбранным фильтром.</span>
          </div>
        )}
      </div>
      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.currentTarget === e.target && !saving) setOpen(false)
          }}
        >
          <form className="modal wide-modal" onSubmit={submit}>
            <div className="modal-head">
              <div>
                <span className="section-label">PROXMOX / NEW VM</span>
                <h3>Создать виртуальную машину</h3>
                <p>VM будет создана в Proxmox и сохранена в реестре Nova.</p>
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
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Например, smm-agent-01"
              />
            </label>
            <label>
              Описание
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Назначение виртуальной машины"
              />
            </label>
            <div className="form-grid">
              <label>
                CPU cores
                <input
                  type="number"
                  min="1"
                  value={cores}
                  onChange={e => setCores(Number(e.target.value))}
                />
              </label>
              <label>
                RAM, MB
                <input
                  type="number"
                  min="512"
                  step="512"
                  value={ram}
                  onChange={e => setRam(Number(e.target.value))}
                />
              </label>
              <label>
                Диск, GB
                <input
                  type="number"
                  min="8"
                  value={rom}
                  onChange={e => setRom(Number(e.target.value))}
                />
              </label>
              <label>
                OS type
                <input
                  type="number"
                  min="1"
                  value={ostype}
                  onChange={e => setOstype(Number(e.target.value))}
                />
              </label>
            </div>
            {error && <div className="error-box">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button className="primary-button" disabled={saving}>
                {saving ? 'Создание…' : 'Создать VM'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
