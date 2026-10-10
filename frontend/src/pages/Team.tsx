import { useMemo, useState, type FormEvent } from 'react'
import { Mail, Plus, ShieldCheck, UserRound, Users } from 'lucide-react'
import { api, type User } from '../lib/api'

export function Team({
  users,
  currentUserId,
  onCreated,
  onUpdated,
}: {
  users: User[]
  currentUserId: number
  onCreated: (user: User) => void
  onUpdated: (user: User) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isStaff, setIsStaff] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<number | null>(null)

  const filtered = useMemo(
    () => users.filter(u => (u.name + ' ' + u.email).toLowerCase().includes(query.toLowerCase())),
    [users, query]
  )
  const staffCount = users.filter(u => u.is_staff).length

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setIsStaff(false)
    setEditing(null)
    setError('')
  }
  function startCreate() {
    reset()
    setOpen(true)
  }
  function startEdit(user: User) {
    setEditing(user.id)
    setName(user.name)
    setEmail(user.email)
    setPhone(user.phone_number ?? '')
    setPassword('')
    setIsStaff(user.is_staff)
    setError('')
    setOpen(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim() || null,
        telegram_link: null,
        whatsapp_link: null,
        instagram_link: null,
        vk_link: null,
      }
      if (!payload.name || !payload.email) throw new Error('Заполните имя и email')
      if (editing) {
        const updated = await api.updateUser(editing, payload)
        const previous = users.find(u => u.id === editing)
        const result =
          previous && previous.is_staff !== isStaff
            ? await api.updateStaff(editing, isStaff)
            : updated
        onUpdated(result)
      } else {
        if (password.length < 12) throw new Error('Пароль должен содержать минимум 12 символов')
        const created = await api.createUser({ ...payload, password })
        if (isStaff) {
          onCreated(await api.updateStaff(created.id, true))
        } else {
          onCreated(created)
        }
      }
      setOpen(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить пользователя')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <div>
          <span className="section-label">SAAS / USERS</span>
          <h2>Команда</h2>
          <p>
            Пользователи Nova. Доступ к SaaS получают только пользователи с{' '}
            <code>is_staff = true</code>.
          </p>
        </div>
        <button className="primary-button" onClick={startCreate}>
          <Plus size={17} /> Новый пользователь
        </button>
      </div>
      <div className="settings-grid">
        <section className="panel setting-card">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <h3>Пользователи</h3>
          <strong>{users.length}</strong>
          <p>Все зарегистрированные пользователи SaaS.</p>
        </section>
        <section className="panel setting-card">
          <div className="metric-icon">
            <ShieldCheck size={20} />
          </div>
          <h3>SaaS-доступ</h3>
          <strong>{staffCount} staff</strong>
          <p>
            Только пользователи с <code>is_staff = true</code> имеют доступ к интерфейсу Nova.
          </p>
        </section>
      </div>
      <div className="filterbar">
        <div className="search">
          <UserRound size={16} />
          <input
            placeholder="Поиск по имени или email"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <span className="result-count">
          {filtered.length} из {users.length}
        </span>
      </div>
      <section className="table-panel">
        <div className="table-head team-user-head">
          <span>ПОЛЬЗОВАТЕЛЬ</span>
          <span>EMAIL</span>
          <span>ДОСТУП</span>
          <span>СОЗДАН</span>
          <span />
        </div>
        {filtered.map(user => (
          <div className="table-row team-user-row" key={user.id}>
            <div className="identity">
              <div className="agent-avatar">
                <UserRound size={18} />
              </div>
              <div>
                <strong>{user.name}</strong>
                <span>
                  ID #{user.id}
                  {user.phone_number ? ` · ${user.phone_number}` : ''}
                </span>
              </div>
            </div>
            <div className="muted">
              <Mail size={14} />
              {user.email}
            </div>
            <div>
              <span className={user.is_staff ? 'access-badge staff' : 'access-badge'}>
                {user.is_staff ? 'STAFF / SaaS' : 'NO ACCESS'}
              </span>
            </div>
            <div className="muted">{new Date(user.created_at).toLocaleDateString('ru-RU')}</div>
            <button
              className="icon-button ghost"
              onClick={() => startEdit(user)}
              aria-label="Редактировать"
            >
              •••
            </button>
          </div>
        ))}
        {!filtered.length && (
          <div className="empty-table">
            <Users size={28} />
            <strong>Пользователи не найдены</strong>
            <span>Создайте первого пользователя команды.</span>
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
                <span className="section-label">SAAS / USER</span>
                <h3>{editing ? 'Редактировать пользователя' : 'Создать пользователя'}</h3>
                <p>
                  Пользователь — сотрудник, которому может быть выдан доступ к SaaS.
                  AI-агенты создаются отдельно.
                </p>
              </div>
              <button
                type="button"
                className="icon-button ghost"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              <label>
                Имя
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Имя пользователя"
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </label>
            </div>
            <label>
              Телефон
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Необязательно"
              />
            </label>
            {!editing && (
              <label>
                Пароль
                <input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Минимум 12 символов"
                />
              </label>
            )}
            <label className="staff-toggle">
              <input
                type="checkbox"
                checked={isStaff}
                disabled={editing === currentUserId}
                onChange={e => setIsStaff(e.target.checked)}
              />
              <span>
                <strong>Доступ к SaaS</strong>
                <small>
                  Разрешить доступ к Nova для этого пользователя (<code>is_staff = true</code>).{' '}
                  {editing === currentUserId ? 'Свой staff-доступ нельзя отключить.' : ''}
                </small>
              </span>
            </label>
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
                {saving ? 'Сохранение…' : editing ? 'Сохранить' : 'Создать пользователя'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
