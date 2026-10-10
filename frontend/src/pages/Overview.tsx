import {
  Activity,
  Bot,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  Database,
} from '../components/Icons'
import { MetricCard } from '../components/MetricCard'
import { StatusBadge } from '../components/StatusBadge'
import type { Agent, Vm } from '../lib/api'

export function Overview({
  agents,
  vms,
  onOpenAgents,
  onOpenVms,
}: {
  agents: Agent[]
  vms: Vm[]
  onOpenAgents: () => void
  onOpenVms: () => void
}) {
  const active = vms.filter(v => v.status === 'ACTIVE').length
  const errors = vms.filter(v => v.status === 'ERROR').length
  const totalRam = vms.reduce((n, v) => n + v.ram, 0)

  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="hero-kicker">EXECUTIVE CONTROL</span>
          <h2>
            Работа AI-команды
            <br />
            <em>под контролем.</em>
          </h2>
          <p>
            Единая поверхность для состояния агентов, инфраструктуры и операционных сигналов.
          </p>
        </div>
        <div className="hero-orb">
          <div className="orb-core">
            <Activity size={27} />
          </div>
          <span className="orb-label">
            МИЯ
            <br />
            <small>EXECUTIVE ASSISTANT</small>
          </span>
        </div>
      </section>

      <div className="metrics">
        <MetricCard
          label="AI-агенты"
          value={agents.length}
          detail={agents.length ? 'зарегистрировано' : 'нет данных'}
          icon={<Bot size={20} />}
        />
        <MetricCard
          label="VM"
          value={vms.length}
          detail={`${active} активных`}
          icon={<Boxes size={20} />}
        />
        <MetricCard
          label="Ресурсы"
          value={`${Math.round((totalRam / 1024) * 10) / 10} GB`}
          detail="суммарная RAM"
          icon={<Cpu size={20} />}
        />
        <MetricCard
          label="Сигналы"
          value={errors}
          detail={errors ? 'требуют внимания' : 'критических нет'}
          icon={errors ? <Clock3 size={20} /> : <CheckCircle2 size={20} />}
        />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-label">AI TEAM</span>
              <h3>Активные агенты</h3>
            </div>
            <button className="text-button" onClick={onOpenAgents}>
              Все агенты <ChevronRight size={15} />
            </button>
          </div>
          {agents.length ? (
            <div className="agent-list">
              {agents.slice(0, 5).map(a => (
                <div className="agent-row" key={a.id}>
                  <div className="agent-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="row-main">
                    <strong>{a.agent_name}</strong>
                    <span>{a.agent_description || 'Описание не задано'}</span>
                  </div>
                  <span className="permission">{a.agent_permission}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <Bot size={25} />
              <p>Агенты ещё не зарегистрированы.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-label">INFRASTRUCTURE</span>
              <h3>Виртуальные машины</h3>
            </div>
            <button className="text-button" onClick={onOpenVms}>
              Все VM <ChevronRight size={15} />
            </button>
          </div>
          {vms.length ? (
            <div className="vm-list">
              {vms.slice(0, 5).map(v => (
                <div className="vm-row" key={v.id}>
                  <div className="vm-symbol">
                    <Database size={17} />
                  </div>
                  <div className="row-main">
                    <strong>{v.title}</strong>
                    <span>
                      {v.ipv4 || 'IP не назначен'} · {v.cores} CPU · {v.ram} MB
                    </span>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <Database size={25} />
              <p>Виртуальные машины не найдены.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
