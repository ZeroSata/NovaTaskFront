import { useState, type FormEvent } from 'react'
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'

export function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.login(email.trim(), password)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">N</div>
          <div>
            <strong>nova</strong>
            <span>AI operations</span>
          </div>
        </div>
        <div className="auth-icon">
          <ShieldCheck size={25} />
        </div>
        <span className="section-label">NOVA / SECURE ACCESS</span>
        <h1>Вход в Nova</h1>
        <p className="auth-copy">
          Доступ к SaaS получают только пользователи с <code>is_staff = true</code>.
        </p>
        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-button auth-submit" disabled={loading}>
            <LockKeyhole size={16} />
            {loading ? 'Проверка…' : 'Войти'}
            <LogIn size={16} />
          </button>
        </form>
      </section>
    </main>
  )
}
