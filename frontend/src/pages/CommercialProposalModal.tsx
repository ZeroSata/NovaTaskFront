import { useState } from 'react'
import { Check, Copy, Download, Printer, X } from 'lucide-react'
import { NovaLogo } from '../components/NovaLogo'
import type { LeadSubmission, PricingConfig, PriceResult } from '../lib/constructorTypes'
import { generateCommercialProposal } from '../lib/proposalGenerator'
import { trackEvent } from '../lib/analytics'

interface CommercialProposalModalProps {
  lead: LeadSubmission
  config: PricingConfig
  pricing: PriceResult
  onClose: () => void
}

export function CommercialProposalModal({
  lead,
  config,
  pricing,
  onClose,
}: CommercialProposalModalProps) {
  const [copied, setCopied] = useState(false)
  const product = config.products.find(p => p.id === lead.state.productId) ?? config.products[0]
  const selectedFeatures = config.features.filter(f => lead.state.featureIds.includes(f.id))
  const selectedIntegrations = config.integrations.filter(i => lead.state.integrationIds.includes(i.id))

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const kpNumber = `KP-${Date.now().toString().slice(-6)}`
  const rawText = generateCommercialProposal(lead, config, pricing)

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText)
    setCopied(true)
    trackEvent({ type: 'KP_VIEW_OR_DOWNLOAD' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    trackEvent({ type: 'KP_VIEW_OR_DOWNLOAD' })
    window.print()
  }

  const handleDownloadTxt = () => {
    trackEvent({ type: 'KP_VIEW_OR_DOWNLOAD' })
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Nova_Proposal_${kpNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="modal-backdrop kp-modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="kp-modal-container">
        {/* Панель действий в шапке */}
        <div className="kp-toolbar no-print">
          <div className="kp-toolbar-left">
            <span className="kp-badge">ОФИЦИАЛЬНОЕ КП</span>
            <strong>{kpNumber}</strong>
          </div>
          <div className="kp-toolbar-actions">
            <button className="secondary-button" onClick={handleCopy} title="Скопировать текст КП">
              {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
              <span>{copied ? 'Скопировано' : 'Копировать'}</span>
            </button>
            <button className="secondary-button" onClick={handleDownloadTxt} title="Скачать текст КП">
              <Download size={16} />
              <span>Скачать .txt</span>
            </button>
            <button className="primary-button gold-btn" onClick={handlePrint} title="Распечатать или сохранить в PDF">
              <Printer size={16} />
              <span>Печать / PDF</span>
            </button>
            <button className="icon-button ghost" onClick={onClose} title="Закрыть">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Документ КП */}
        <div className="kp-document-paper printable-area">
          <div className="kp-doc-header">
            <div className="kp-brand">
              <NovaLogo size={28} />
              <div className="kp-brand-meta">
                <span>Платформа корпоративной автоматизации</span>
                <small>https://nova-ai.io · contact@nova-ai.io</small>
              </div>
            </div>
            <div className="kp-meta-box">
              <div className="kp-doc-num">{kpNumber}</div>
              <div className="kp-doc-date">от {dateStr}</div>
              <div className="kp-doc-status">Действительно 14 календарных дней</div>
            </div>
          </div>

          <div className="kp-divider" />

          {/* Блок адресата */}
          <div className="kp-client-block">
            <div className="kp-client-col">
              <span className="kp-field-title">ЗАКАЗЧИК:</span>
              <strong className="kp-client-name">{lead.companyName || 'Индивидуальный заказчик'}</strong>
              <div className="kp-client-details">
                <span>Контактное лицо: {lead.contactName}</span>
                <span>Email: {lead.contactEmail}</span>
                <span>Телефон/TG: {lead.contactPhone}</span>
              </div>
            </div>
            <div className="kp-client-col">
              <span className="kp-field-title">ИСПОЛНИТЕЛЬ:</span>
              <strong>Nova AI Operations</strong>
              <div className="kp-client-details">
                <span>Архитектурное бюро AI-решений</span>
                <span>Единая среда виртуальных сотрудников</span>
                <span>Выделенная Proxmox/KVM инфраструктура</span>
              </div>
            </div>
          </div>

          <div className="kp-subject">
            <h3>Коммерческое предложение на проектирование и внедрение AI-агентов</h3>
            <p>
              В соответствии с предварительной конфигурацией направляем спецификацию программно-аппаратного комплекса,
              состав интеграций и смету реализации.
            </p>
          </div>

          {/* Раздел 1. Продукт */}
          <div className="kp-section">
            <h4 className="kp-section-title">1. Выбранный формат решения</h4>
            <div className="kp-product-highlight">
              <div>
                <strong>{product.title}</strong> — {product.subtitle}
                <p>{product.description}</p>
              </div>
              <span className="kp-prod-tag">{product.badge || 'Solution'}</span>
            </div>
            <div className="kp-params-grid">
              <div>
                <span>Специализация:</span>
                <strong>{lead.state.agentSpecialization || 'Универсальный ассистент'}</strong>
              </div>
              <div>
                <span>Рабочие места:</span>
                <strong>
                  {lead.state.employeeCount} сотрудников ({lead.state.adminCount} админ)
                </strong>
              </div>
              <div>
                <span>Выделенное хранилище RAG:</span>
                <strong>{lead.state.storageGb} GB</strong>
              </div>
              <div>
                <span>Модель AI-токенов:</span>
                <strong>
                  {lead.state.aiPaymentMode === 'shared-balance'
                    ? 'Единый баланс Nova'
                    : lead.state.aiPaymentMode === 'own-account'
                    ? 'Собственный ключ заказчика'
                    : 'Согласование на аудите'}
                </strong>
              </div>
            </div>
          </div>

          {/* Раздел 2. Функции и сценарии */}
          <div className="kp-section">
            <h4 className="kp-section-title">2. Функциональные возможности ({selectedFeatures.length})</h4>
            <table className="kp-table">
              <thead>
                <tr>
                  <th>Модуль</th>
                  <th>Категория</th>
                  <th>Разово</th>
                  <th>В месяц</th>
                </tr>
              </thead>
              <tbody>
                {selectedFeatures.map(f => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.title}</strong>
                      <div className="kp-muted-desc">{f.description}</div>
                    </td>
                    <td>{f.category}</td>
                    <td>{f.setupPrice > 0 ? `${f.setupPrice.toLocaleString('ru-RU')} ₽` : 'В тарифе'}</td>
                    <td>{f.monthlyPrice > 0 ? `${f.monthlyPrice.toLocaleString('ru-RU')} ₽/мес` : '0 ₽/мес'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Раздел 3. Интеграции и каналы */}
          <div className="kp-section">
            <h4 className="kp-section-title">3. Каналы связи и интеграции ({selectedIntegrations.length})</h4>
            <table className="kp-table">
              <thead>
                <tr>
                  <th>Канал / Сервис</th>
                  <th>Сложность</th>
                  <th>Тип коннектора</th>
                  <th>Подключение</th>
                  <th>Сопровождение</th>
                </tr>
              </thead>
              <tbody>
                {selectedIntegrations.map(i => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.title}</strong>
                      <div className="kp-muted-desc">{i.description}</div>
                      {i.restrictionsNote && (
                        <div className="kp-note">Ограничение: {i.restrictionsNote}</div>
                      )}
                    </td>
                    <td>{typeof i.level === 'number' ? `Уровень ${i.level}` : 'Индивидуально'}</td>
                    <td>{i.hasReadyConnector ? 'Готовый шлюз' : 'Кастомная разработка'}</td>
                    <td>{i.setupPrice > 0 ? `${i.setupPrice.toLocaleString('ru-RU')} ₽` : '0 ₽'}</td>
                    <td>{i.monthlyPrice > 0 ? `${i.monthlyPrice.toLocaleString('ru-RU')} ₽/мес` : '0 ₽/мес'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Раздел 4. Финансовый расчёт */}
          <div className="kp-section">
            <h4 className="kp-section-title">4. Финансовый расчёт и смета</h4>

            {pricing.requiresIndividualEstimate ? (
              <div className="kp-individual-box">
                <strong>Требуется индивидуальное согласование сметы</strong>
                <p>
                  В состав конфигурации включены компоненты повышенной сложности или превышен базовый лимит
                  интеграций:
                </p>
                <ul>
                  {pricing.estimateReasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
                <p className="kp-note">
                  Архитектор Nova свяжется с вами для проведения бесплатного технического брифинга и фиксации
                  финального бюджета.
                </p>
              </div>
            ) : (
              <div className="kp-pricing-summary-card">
                <div className="kp-sum-row">
                  <span>1. Разовые пусконаладочные работы (Setup & интеграция):</span>
                  <strong>{(pricing.setupPrice ?? 0).toLocaleString('ru-RU')} ₽</strong>
                </div>
                <div className="kp-sum-row">
                  <span>2. Ежемесячная подписка, поддержка и инфраструктура:</span>
                  <strong>{(pricing.monthlyPrice ?? 0).toLocaleString('ru-RU')} ₽/мес</strong>
                </div>
                {pricing.aiBudgetEstimateMonthly && (
                  <div className="kp-sum-row ai-sub">
                    <span>— Оценка бюджета AI-токенов (по факту расхода):</span>
                    <span>~{pricing.aiBudgetEstimateMonthly.toLocaleString('ru-RU')} ₽/мес</span>
                  </div>
                )}
                <div className="kp-divider" />
                <div className="kp-sum-row kp-total-row">
                  <span>ИТОГО К ОПЛАТЕ ЗА ПЕРВЫЙ ПЕРИОД (Запуск + 1-й месяц):</span>
                  <span className="kp-total-sum">{(pricing.firstPeriodTotal ?? 0).toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            )}
          </div>

          {/* Раздел 5. Сроки и условия */}
          <div className="kp-section">
            <h4 className="kp-section-title">5. Этапы ввода в эксплуатацию</h4>
            <div className="kp-timeline-steps">
              <div className="kp-step">
                <span className="kp-step-num">01</span>
                <div>
                  <strong>Брифинг и ТЗ (1-2 дня)</strong>
                  <p>Согласование ролей, Tone of Voice и регламентов доступа.</p>
                </div>
              </div>
              <div className="kp-step">
                <span className="kp-step-num">02</span>
                <div>
                  <strong>Развёртывание контура (3-5 дней)</strong>
                  <p>Инициализация VM, подключение коннекторов и RAG-индексация.</p>
                </div>
              </div>
              <div className="kp-step">
                <span className="kp-step-num">03</span>
                <div>
                  <strong>Тестирование и запуск (2-3 дня)</strong>
                  <p>Контрольные диалоги, проверка ограничений, инструктаж сотрудников.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Подвал документа */}
          <div className="kp-doc-footer">
            <div className="kp-stamp-block">
              <span>Nova AI Operations</span>
              <p>Менеджер проекта: Александр Морозов</p>
              <p>Технический архитектор: отдел AI Systems</p>
            </div>
            <div className="kp-legal-disclaimer">
              * Документ сформирован автоматически интерактивным конфигуратором Nova. Все условия фиксируются в договоре оказания услуг.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
