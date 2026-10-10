import { useEffect, useState } from 'react'
import { Activity, Clock3, MessageSquareText } from '../components/Icons'
import { api, type Backlog, type Vm } from '../lib/api'

export function Journal({ vms }: { vms: Vm[] }) {
  const [selected, setSelected] = useState<number | null>(vms[0]?.id ?? null)
  const [items, setItems] = useState<Backlog[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (selected === null) {
      setItems([])
      return
    }
    setError('')
    api
      .connections(selected)
      .then(setItems)
      .catch(e => setError(e.message))
  }, [selected])

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <div>
          <span className="section-label">AUDIT / CONNECTIONS</span>
          <h2>Журнал подключений</h2>
          <p>История взаимодействия сотрудников с виртуальными машинами.</p>
        </div>
      </div>
      <div className="journal-layout">
        <section className="panel vm-picker">
          <div className="panel-head">
            <h3>Виртуальные машины</h3>
          </div>
          {vms.map(v => (
            <button
              className={selected === v.id ? 'picker active' : ''}
              key={v.id}
              onClick={() => setSelected(v.id)}
            >
              <div className="vm-symbol">
                <Activity size={16} />
              </div>
              <div>
                <strong>{v.title}</strong>
                <span>{v.ipv4 || 'без IP'}</span>
              </div>
            </button>
          ))}
          {!vms.length && (
            <div className="panel-empty">
              <p>Нет VM для просмотра.</p>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-label">EVENT STREAM</span>
              <h3>{vms.find(v => v.id === selected)?.title ?? 'Выберите VM'}</h3>
            </div>
            <span className="result-count">{items.length} событий</span>
          </div>
          {error ? (
            <div className="error-box">Не удалось загрузить журнал: {error}</div>
          ) : items.length ? (
            <div className="timeline">
              {items.map(i => (
                <div className="event" key={i.id}>
                  <div className="event-dot" />
                  <div>
                    <strong>{i.message}</strong>
                    <span>
                      <Clock3 size={13} />
                      {new Date(i.created_at).toLocaleString('ru-RU')} · сотрудник #{i.staff_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <MessageSquareText size={25} />
              <p>Для этой VM пока нет записей.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
