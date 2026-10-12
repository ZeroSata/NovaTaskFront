import { useState, useEffect, useMemo, type FormEvent } from 'react'
import {
  defaultPricingConfig,
  loadPricingConfig,
} from '../lib/pricingConfig'
import { calculatePrice } from '../lib/pricingCalculator'
import type {
  ConstructorState,
  PricingConfig,
  LeadSubmission,
} from '../lib/constructorTypes'
import {
  CheckCircle2,
  CircleAlert,
  RefreshCw,
  X,
  FileText,
  ShieldCheck,
  HardDrive,
  Users,
  Zap,
  Briefcase,
  Layers,
  ChevronRight,
  Printer,
} from '../components/Icons'
import { CommercialProposalModal } from './CommercialProposalModal'
import { trackEvent } from '../lib/analytics'
import { api } from '../lib/api'

const STORAGE_KEY = 'nova_constructor_state_v1'

const initialDefaultState: ConstructorState = {
  productId: 'prod-single',
  agentSpecialization: 'AI-SMM-ассистент и контент-мейкер',
  agentSpecializations: ['AI-SMM-ассистент и контент-мейкер'],
  featureIds: ['ft-text-gen', 'ft-doc-search'],
  integrationIds: ['int-tg-bot'],
  employeeCount: 2,
  adminCount: 1,
  accessRights: {
    personalHistory: true,
    companyKnowledgeBase: true,
    individualKnowledgeBase: false,
    rbacRestrictions: false,
  },
  publishingOptions: {
    publishText: true,
    publishMedia: true,
    commentModeration: false,
    collectStats: false,
  },
  storageGb: 10,
  fileCountEstimate: 50,
  manualDocProcessing: false,
  customImport: false,
  largeArchiveRecognition: false,
  aiPaymentMode: 'shared-balance',
  clientComment: '',
}

const STEPS = [
  { id: 1, title: 'Формат', label: 'Продукт & Роль' },
  { id: 2, title: 'Функции', label: 'Возможности' },
  { id: 3, title: 'Каналы', label: 'Интеграции & Постинг' },
  { id: 4, title: 'Команда', label: 'Доступы & Права' },
  { id: 5, title: 'База знаний', label: 'RAG & Хранилище' },
  { id: 6, title: 'AI-бюджет', label: 'План & Токены' },
]

const SPECIALIZATIONS = [
  'Образовательный AI-помощник / AI-методист',
  'AI-SMM-ассистент и контент-мейкер',
  'Поддержка клиентов и оператор первой линии 24/7',
  'Корпоративный RAG-помощник по регламентам и HR',
  'Аналитик данных и операционной отчётности',
  'Индивидуальный отраслевой ассистент',
]

interface ConstructorModalProps {
  initialProductId?: string
  onClose: () => void
}

export function ConstructorModal({ initialProductId, onClose }: ConstructorModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig)

  const [state, setState] = useState<ConstructorState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (initialProductId) {
          parsed.productId = initialProductId
        }
        return { ...initialDefaultState, ...parsed }
      }
    } catch {}
    return {
      ...initialDefaultState,
      ...(initialProductId ? { productId: initialProductId } : {}),
    }
  })

  // Модальные окна
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [leadSuccess, setLeadSuccess] = useState(false)
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadError, setLeadError] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [wantsKpDownload, setWantsKpDownload] = useState(true)

  // Просмотр сформированного КП
  const [viewingKpModal, setViewingKpModal] = useState(false)
  const [lastSubmittedLead, setLastSubmittedLead] = useState<LeadSubmission | null>(null)

  useEffect(() => {
    trackEvent({ type: 'CONSTRUCTOR_OPEN' })
    loadPricingConfig().then(setConfig)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingKpModal) {
          setViewingKpModal(false)
        } else if (leadModalOpen) {
          setLeadModalOpen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      trackEvent({ type: 'CONSTRUCTOR_CLOSE' })
    }
  }, [onClose, leadModalOpen, viewingKpModal])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const pricing = useMemo(() => calculatePrice(state, config), [state, config])
  const selectedProduct = config.products.find(p => p.id === state.productId) ?? config.products[0]
  const isBundle = state.productId === 'prod-bundle' || selectedProduct.type === 'bundle'

  const selectedSpecs = useMemo(() => {
    if (state.agentSpecializations && state.agentSpecializations.length > 0) {
      return state.agentSpecializations
    }
    if (state.agentSpecialization) {
      return state.agentSpecialization.split(', ').map(s => s.trim()).filter(Boolean)
    }
    return [SPECIALIZATIONS[0]]
  }, [state.agentSpecializations, state.agentSpecialization])

  const handleStepChange = (newStep: number) => {
    trackEvent({ type: 'STEP_CHANGE', fromStep: currentStep, toStep: newStep })
    setCurrentStep(newStep)
  }

  const handleProductSelect = (prodId: string) => {
    trackEvent({ type: 'PRODUCT_SELECT', productId: prodId })
    setState(s => {
      if (prodId === 'prod-bundle') {
        const current = s.agentSpecializations && s.agentSpecializations.length > 0
          ? s.agentSpecializations
          : s.agentSpecialization ? s.agentSpecialization.split(', ').map(x => x.trim()).filter(Boolean) : [SPECIALIZATIONS[0]]
        const nextSpecs = [...current]
        if (nextSpecs.length < 2) {
          const nextAvail = SPECIALIZATIONS.find(sp => !nextSpecs.includes(sp)) || SPECIALIZATIONS[1]
          nextSpecs.push(nextAvail)
        }
        return {
          ...s,
          productId: prodId,
          agentSpecializations: nextSpecs,
          agentSpecialization: nextSpecs.join(', '),
        }
      } else {
        const singleSpec = s.agentSpecializations?.[0] || s.agentSpecialization?.split(', ')[0] || SPECIALIZATIONS[0]
        return {
          ...s,
          productId: prodId,
          agentSpecializations: [singleSpec],
          agentSpecialization: singleSpec,
        }
      }
    })
  }

  const handleSpecToggle = (spec: string) => {
    if (isBundle) {
      const isSelected = selectedSpecs.includes(spec)
      let nextSpecs: string[]
      if (isSelected) {
        if (selectedSpecs.length > 1) {
          nextSpecs = selectedSpecs.filter(s => s !== spec)
        } else {
          nextSpecs = selectedSpecs
        }
      } else {
        nextSpecs = [...selectedSpecs, spec]
      }
      setState(s => ({
        ...s,
        agentSpecializations: nextSpecs,
        agentSpecialization: nextSpecs.join(', '),
      }))
    } else {
      setState(s => ({
        ...s,
        agentSpecializations: [spec],
        agentSpecialization: spec,
      }))
    }
  }

  const handleReset = () => {
    if (window.confirm('Сбросить выбранные параметры конструктора к начальным значениям?')) {
      trackEvent({ type: 'CONFIG_RESET' })
      setState(initialDefaultState)
      setCurrentStep(1)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const toggleFeature = (fid: string) => {
    setState(prev => {
      const exists = prev.featureIds.includes(fid)
      return {
        ...prev,
        featureIds: exists
          ? prev.featureIds.filter(id => id !== fid)
          : [...prev.featureIds, fid],
      }
    })
  }

  const toggleIntegration = (iid: string) => {
    setState(prev => {
      const exists = prev.integrationIds.includes(iid)
      if (exists) {
        trackEvent({ type: 'INTEGRATION_REMOVE', integrationId: iid })
        return { ...prev, integrationIds: prev.integrationIds.filter(id => id !== iid) }
      } else {
        trackEvent({ type: 'INTEGRATION_ADD', integrationId: iid })
        return { ...prev, integrationIds: [...prev.integrationIds, iid] }
      }
    })
  }

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLeadError('')
    setLeadSubmitting(true)
    trackEvent({ type: 'FORM_START' })

    const payload: LeadSubmission = {
      contactName,
      contactPhone,
      contactEmail,
      companyName,
      wantsKpDownload,
      state,
      pricingSummary: pricing,
    }

    try {
      const res = await api.construct.submitLead(payload)
      if (!res.success) {
        throw new Error('Не удалось зафиксировать заявку. Проверьте данные и повторите.')
      }

      setLastSubmittedLead(payload)
      setLeadSuccess(true)
      trackEvent({ type: 'LEAD_SUBMIT_SUCCESS', wantsKp: wantsKpDownload })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки заявки'
      setLeadError(msg)
      trackEvent({ type: 'LEAD_SUBMIT_ERROR', error: msg })
    } finally {
      setLeadSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop builder-modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="builder-modal-window">
        {/* Шапка модального окна конструктора */}
        <header className="builder-modal-header">
          <div className="builder-header-left">
            <span className="construct-eyebrow">NOVA / INTERACTIVE BUILDER</span>
            <div className="builder-title-row">
              <h2 className="builder-modal-title">Конструктор AI-сервисов</h2>
              <span className="builder-tag">Online Calculator</span>
            </div>
          </div>

          <div className="builder-header-actions">
            <button className="icon-button ghost builder-close-btn" onClick={onClose} title="Закрыть конструктор">
              <X size={22} />
            </button>
          </div>
        </header>

        {/* Степпер шагов */}
        <div className="wizard-stepper">
          {STEPS.map(s => {
            const isActive = currentStep === s.id
            const isPassed = currentStep > s.id
            return (
              <div
                key={s.id}
                className={`wizard-step-item ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                onClick={() => handleStepChange(s.id)}
              >
                <div className="wizard-step-badge">{isPassed ? '✓' : `0${s.id}`}</div>
                <div className="wizard-step-text">
                  <span className="step-label">{s.title}</span>
                  <strong className="step-name">{s.label}</strong>
                </div>
              </div>
            )
          })}
        </div>

        {/* Основной контент: шаг слева + липкая сводка справа */}
        <div className="builder-modal-body">
          <div className="construct-layout">
            <div className="construct-main">
              {/* ШАГ 1: ВЫБОР ПРОДУКТА И СПЕЦИАЛИЗАЦИИ */}
              {currentStep === 1 && (
                <section className="calc-section">
                  <div className="calc-section-head">
                    <span className="step-num">01</span>
                    <div>
                      <h2>Формат решения и специализация</h2>
                      <p>Выберите архитектуру и профильную роль под масштаб задач организации.</p>
                    </div>
                  </div>

                  {/* Специализация агента */}
                  <div className="spec-picker-box">
                    <div className="spec-picker-header">
                      <div>
                        <span className="field-label">Назначение / ключевая роль AI-ассистента:</span>
                        <p className="spec-picker-desc">
                          {isBundle
                            ? 'Для комплекта AI-агентов выберите от 2 специализаций (связка специалистов с единой базой):'
                            : 'Выберите ключевую профильную роль для виртуального специалиста:'}
                        </p>
                      </div>
                      {isBundle && (
                        <div className={`spec-count-badge ${selectedSpecs.length >= 2 ? 'valid' : 'warning'}`}>
                          <span className={`badge-dot ${selectedSpecs.length >= 2 ? 'valid' : 'warning'}`} />
                          {selectedSpecs.length >= 2 ? (
                            <span>Выбрано ролей: <strong>{selectedSpecs.length}</strong></span>
                          ) : (
                            <span>Выбрано: <strong>{selectedSpecs.length}</strong> (нужно 2+)</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="spec-chips-row">
                      {SPECIALIZATIONS.map((spec, i) => {
                        const isSelected = selectedSpecs.includes(spec)
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`spec-chip-btn ${isSelected ? 'active' : ''} ${isBundle ? 'bundle-chip' : ''}`}
                            onClick={() => handleSpecToggle(spec)}
                            title={isBundle ? (isSelected ? 'Снять выбор' : 'Добавить в комплект') : undefined}
                          >
                            {isBundle && (
                              <span className={`chip-indicator ${isSelected ? 'selected' : ''}`}>
                                {isSelected ? '✓' : '+'}
                              </span>
                            )}
                            <span>{spec}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="product-cards-grid">
                    {config.products.map(prod => {
                      const isSelected = prod.id === state.productId
                      return (
                        <div
                          key={prod.id}
                          className={`product-select-card ${isSelected ? 'active' : ''}`}
                          onClick={() => handleProductSelect(prod.id)}
                        >
                          {prod.badge && <span className="product-badge">{prod.badge}</span>}
                          <div className="prod-title">{prod.title}</div>
                          <div className="prod-sub">{prod.subtitle}</div>
                          <div className="prod-desc">{prod.description}</div>
                          <div className="prod-prices">
                            <div className="prod-price-item">
                              <span>Запуск</span>
                              <strong>
                                {prod.type === 'consultation'
                                  ? '0 ₽ (Бесплатно)'
                                  : `${prod.baseSetupPrice.toLocaleString('ru-RU')} ₽`}
                              </strong>
                            </div>
                            <div className="prod-price-item">
                              <span>Поддержка</span>
                              <strong>
                                {prod.type === 'consultation'
                                  ? 'По согласованию'
                                  : `${prod.baseMonthlyPrice.toLocaleString('ru-RU')} ₽/мес`}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ШАГ 2: ФУНКЦИОНАЛЬНЫЕ ВОЗМОЖНОСТИ */}
              {currentStep === 2 && (
                <section className="calc-section">
                  <div className="calc-section-head">
                    <span className="step-num">02</span>
                    <div>
                      <h2>Функциональные возможности</h2>
                      <p>
                        Отметьте необходимые навыки ассистента. Недоступные для тарифа опции блокируются.
                      </p>
                    </div>
                  </div>

                  <div className="options-grid">
                    {config.features.map(feat => {
                      const isChecked = state.featureIds.includes(feat.id)
                      const isAllowed = selectedProduct.allowedFeatureIds.includes(feat.id)

                      return (
                        <label
                          key={feat.id}
                          className={`option-check-card ${isChecked ? 'checked' : ''} ${!isAllowed ? 'disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!isAllowed}
                            onChange={() => toggleFeature(feat.id)}
                          />
                          <div className="check-card-body">
                            <div className="check-card-title">
                              <strong>{feat.title}</strong>
                              {feat.requiresIndividualEstimate && (
                                <span className="pill-individual">Индивидуально</span>
                              )}
                              {feat.isHardScenario && (
                                <span className="pill-hard">Сложный сценарий</span>
                              )}
                            </div>
                            <p>{feat.description}</p>
                            <div className="check-card-meta">
                              {feat.setupPrice > 0 && (
                                <span>+ {feat.setupPrice.toLocaleString('ru-RU')} ₽ запуск</span>
                              )}
                              {feat.monthlyPrice > 0 && (
                                <span>+ {feat.monthlyPrice.toLocaleString('ru-RU')} ₽/мес</span>
                              )}
                              {!isAllowed && (
                                <span className="warning-text">Недоступно в тарифе «{selectedProduct.title}»</span>
                              )}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ШАГ 3: ИНТЕГРАЦИИ И КАНАЛЫ ПУБЛИКАЦИИ */}
              {currentStep === 3 && (
                <section className="calc-section">
                  <div className="calc-section-head">
                    <span className="step-num">03</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2>Каналы связи и интеграции</h2>
                        <span className="count-pill">{state.integrationIds.length} выбрано</span>
                      </div>
                      <p>
                        Каждая точка подключения рассчитывается отдельно. Выбор более {config.maxAutoIntegrationsThreshold} интеграций
                        переводит проект в индивидуальный расчёт архитектуры.
                      </p>
                    </div>
                  </div>

                  {/* Дополнительные опции контента и публикаций (по ТЗ Раздел 4.2) */}
                  <div className="publishing-settings-card">
                    <div className="card-subhead">
                      <strong>Специфика публикаций и работы с аудиторией:</strong>
                    </div>
                    <div className="publishing-checkboxes">
                      <label className="pub-check">
                        <input
                          type="checkbox"
                          checked={state.publishingOptions.publishText}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              publishingOptions: { ...s.publishingOptions, publishText: e.target.checked },
                            }))
                          }
                        />
                        <span>Автоматическая публикация текстов</span>
                      </label>
                      <label className="pub-check">
                        <input
                          type="checkbox"
                          checked={state.publishingOptions.publishMedia}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              publishingOptions: { ...s.publishingOptions, publishMedia: e.target.checked },
                            }))
                          }
                        />
                        <span>Публикация готовых изображений и медиафайлов</span>
                      </label>
                      <label className="pub-check">
                        <input
                          type="checkbox"
                          checked={state.publishingOptions.commentModeration}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              publishingOptions: { ...s.publishingOptions, commentModeration: e.target.checked },
                            }))
                          }
                        />
                        <span>Модерация и автоответы на комментарии</span>
                      </label>
                      <label className="pub-check">
                        <input
                          type="checkbox"
                          checked={state.publishingOptions.collectStats}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              publishingOptions: { ...s.publishingOptions, collectStats: e.target.checked },
                            }))
                          }
                        />
                        <span>Сбор и анализ статистики реакций аудитории</span>
                      </label>
                    </div>
                  </div>

                  <div className="integrations-list">
                    {config.integrations.map(integ => {
                      const isChecked = state.integrationIds.includes(integ.id)
                      const isIndividual =
                        integ.level === 'individual' || integ.requiresIndividualEstimate

                      return (
                        <div
                          key={integ.id}
                          className={`integration-row ${isChecked ? 'active' : ''}`}
                          onClick={() => toggleIntegration(integ.id)}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} />
                          <div className="integ-info">
                            <div className="integ-top">
                              <strong>{integ.title}</strong>
                              <span className={`level-tag level-${integ.level}`}>
                                {typeof integ.level === 'number'
                                  ? `Уровень ${integ.level}`
                                  : 'Индивидуально'}
                              </span>
                              {integ.hasReadyConnector ? (
                                <span className="connector-tag">Готовый коннектор</span>
                              ) : (
                                <span className="connector-tag custom">Кастомная разработка</span>
                              )}
                              {integ.requiresAccessGrant && (
                                <span className="access-tag">Требуются доступы</span>
                              )}
                            </div>
                            <p>{integ.description}</p>
                            {integ.restrictionsNote && (
                              <div className="integ-restriction">Ограничение: {integ.restrictionsNote}</div>
                            )}
                          </div>

                          <div className="integ-pricing">
                            {isIndividual ? (
                              <span className="pill-individual">Индивидуальный расчёт</span>
                            ) : (
                              <>
                                <div className="setup-cost">
                                  {integ.setupPrice.toLocaleString('ru-RU')} ₽ запуск
                                </div>
                                {integ.monthlyPrice > 0 ? (
                                  <div className="monthly-cost">
                                    +{integ.monthlyPrice.toLocaleString('ru-RU')} ₽/мес
                                  </div>
                                ) : (
                                  <div className="monthly-cost free">0 ₽/мес</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ШАГ 4: СОТРУДНИКИ И ПРАВА ДОСТУПА */}
              {currentStep === 4 && (
                <section className="calc-section">
                  <div className="calc-section-head">
                    <span className="step-num">04</span>
                    <div>
                      <h2>Сотрудники и разграничение прав доступа</h2>
                      <p>
                        Рабочие места, администраторы и уровни изоляции данных сотрудников.
                      </p>
                    </div>
                  </div>

                  {/* Рабочие места сотрудников */}
                  <div className="counter-box" style={{ marginBottom: '16px' }}>
                    <div className="counter-info">
                      <strong>Рабочие места сотрудников</strong>
                      <p>
                        1 администратор включен в базовый тариф. Дополнительные сотрудники: +
                        {config.extraEmployeeMonthlyPrice.toLocaleString('ru-RU')} ₽/мес за место.
                      </p>
                    </div>
                    <div className="stepper">
                      <button
                        type="button"
                        className="step-btn"
                        disabled={state.employeeCount <= 1}
                        onClick={() =>
                          setState(s => ({ ...s, employeeCount: Math.max(1, s.employeeCount - 1) }))
                        }
                      >
                        -
                      </button>
                      <span className="step-value">{state.employeeCount}</span>
                      <button
                        type="button"
                        className="step-btn"
                        onClick={() => setState(s => ({ ...s, employeeCount: s.employeeCount + 1 }))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Администраторы */}
                  <div className="counter-box" style={{ marginBottom: '24px' }}>
                    <div className="counter-info">
                      <strong>Администраторы системы</strong>
                      <p>
                        Управляют правами, промптами и аудитом логов. 1 администратор включен.
                      </p>
                    </div>
                    <div className="stepper">
                      <button
                        type="button"
                        className="step-btn"
                        disabled={state.adminCount <= 1}
                        onClick={() =>
                          setState(s => ({ ...s, adminCount: Math.max(1, s.adminCount - 1) }))
                        }
                      >
                        -
                      </button>
                      <span className="step-value">{state.adminCount}</span>
                      <button
                        type="button"
                        className="step-btn"
                        disabled={state.adminCount >= state.employeeCount}
                        onClick={() =>
                          setState(s => ({
                            ...s,
                            adminCount: Math.min(s.employeeCount, s.adminCount + 1),
                          }))
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Политики доступа (ТЗ Раздел 4.2) */}
                  <div className="access-policies-panel">
                    <span className="field-label">Настройки разграничения доступов:</span>
                    <div className="knowledge-options">
                      <label className="checkbox-tile">
                        <input
                          type="checkbox"
                          checked={state.accessRights.personalHistory}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              accessRights: { ...s.accessRights, personalHistory: e.target.checked },
                            }))
                          }
                        />
                        <div>
                          <strong>Личная изолированная история диалогов</strong>
                          <p>Каждый сотрудник видит только свои диалоги с агентом.</p>
                        </div>
                      </label>

                      <label className="checkbox-tile">
                        <input
                          type="checkbox"
                          checked={state.accessRights.companyKnowledgeBase}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              accessRights: {
                                ...s.accessRights,
                                companyKnowledgeBase: e.target.checked,
                              },
                            }))
                          }
                        />
                        <div>
                          <strong>Доступ к единой корпоративной базе знаний компании</strong>
                          <p>Все агенты и сотрудники обращаются к единому векторизованному хранилищу.</p>
                        </div>
                      </label>

                      <label className="checkbox-tile">
                        <input
                          type="checkbox"
                          checked={state.accessRights.individualKnowledgeBase}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              accessRights: {
                                ...s.accessRights,
                                individualKnowledgeBase: e.target.checked,
                              },
                            }))
                          }
                        />
                        <div>
                          <strong>Индивидуальная база знаний для отделов/ролей</strong>
                          <p>Изоляция регламентов между отделами (бухгалтерия, маркетинг, разработка).</p>
                        </div>
                      </label>

                      <label className="checkbox-tile">
                        <input
                          type="checkbox"
                          checked={state.accessRights.rbacRestrictions}
                          onChange={e =>
                            setState(s => ({
                              ...s,
                              accessRights: {
                                ...s.accessRights,
                                rbacRestrictions: e.target.checked,
                              },
                            }))
                          }
                        />
                        <div>
                          <strong>Ограничения доступа к конфиденциальным разделам (RBAC)</strong>
                          <p>Маскирование персональных данных и запрет вывода закрытых документов.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {/* ШАГ 5: ХРАНИЛИЩЕ И БАЗА ЗНАНИЙ */}
              {currentStep === 5 && (
                <section className="calc-section">
                  <div className="calc-section-head">
                    <span className="step-num">05</span>
                    <div>
                      <h2>Хранилище, база знаний и обработка файлов</h2>
                      <p>
                        Выделенный объём RAG, количество документов и правила предобработки материалов.
                      </p>
                    </div>
                  </div>

                  {/* Слайдер объема хранилища */}
                  <div className="slider-box">
                    <div className="slider-header">
                      <div>
                        <strong>Объём выделенного хранилища документов</strong>
                        <p>
                          В тарифе: {selectedProduct.includedStorageGb} GB. Сверх лимита: +
                          {config.extraStoragePerGbMonthlyPrice} ₽/GB в месяц.
                        </p>
                      </div>
                      <div className="slider-indicator">{state.storageGb} GB</div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      value={state.storageGb}
                      onChange={e => setState(s => ({ ...s, storageGb: Number(e.target.value) }))}
                      className="gold-range"
                    />
                  </div>

                  {/* Оценка количества файлов */}
                  <div className="slider-box">
                    <div className="slider-header">
                      <div>
                        <strong>Примерное количество рабочих файлов / регламентов</strong>
                        <p>Помогает оценить время предварительной индексации базы.</p>
                      </div>
                      <div className="slider-indicator">~{state.fileCountEstimate} шт.</div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={state.fileCountEstimate}
                      onChange={e =>
                        setState(s => ({ ...s, fileCountEstimate: Number(e.target.value) }))
                      }
                      className="gold-range"
                    />
                  </div>

                  {/* Чекбоксы форматов загрузки и обработки (ТЗ Раздел 4.2 & 6.2) */}
                  <div className="knowledge-options">
                    <label className="checkbox-tile highlight-tile">
                      <input
                        type="checkbox"
                        checked={state.customImport}
                        onChange={e => setState(s => ({ ...s, customImport: e.target.checked }))}
                      />
                      <div>
                        <div className="tile-title">
                          <strong>Нестандартный импорт данных</strong>
                          <span className="pill-individual">Индивидуальный расчёт</span>
                        </div>
                        <p>Импорт из закрытых СУБД, устаревших CRM, закрытых сетевых папок или 1С.</p>
                      </div>
                    </label>

                    <label className="checkbox-tile">
                      <input
                        type="checkbox"
                        checked={state.manualDocProcessing}
                        onChange={e =>
                          setState(s => ({ ...s, manualDocProcessing: e.target.checked }))
                        }
                      />
                      <div>
                        <div className="tile-title">
                          <strong>Ручная подготовка и очистка документов методистом</strong>
                          <span>+{config.manualDocumentPrepPrice.toLocaleString('ru-RU')} ₽ запуск</span>
                        </div>
                        <p>Профессиональная разметка, удаление дублей и чистка шумов перед загрузкой в RAG.</p>
                      </div>
                    </label>

                    <label className="checkbox-tile">
                      <input
                        type="checkbox"
                        checked={state.largeArchiveRecognition}
                        onChange={e =>
                          setState(s => ({ ...s, largeArchiveRecognition: e.target.checked }))
                        }
                      />
                      <div>
                        <div className="tile-title">
                          <strong>Распознавание больших архивов и сканов (OCR)</strong>
                          <span>+{config.archiveProcessingPrice.toLocaleString('ru-RU')} ₽ запуск</span>
                        </div>
                        <p>Потоковая обработка отсканированных PDF, таблиц и печатных документов.</p>
                      </div>
                    </label>
                  </div>
                </section>
              )}

              {/* ШАГ 6: AI-БЮДЖЕТ */}
              {currentStep === 6 && (
                <section className="calc-section">
                  <div className="calc-section-head">
                    <span className="step-num">06</span>
                    <div>
                      <h2>AI-бюджет и финализация заявки</h2>
                      <p>
                        Модель оплаты токенов нейросетей, прозрачность расходов и формирование КП.
                      </p>
                    </div>
                  </div>

                  <div className="ai-modes-grid">
                    <label
                      className={`ai-mode-card ${state.aiPaymentMode === 'shared-balance' ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="ai_mode"
                        value="shared-balance"
                        checked={state.aiPaymentMode === 'shared-balance'}
                        onChange={() => setState(s => ({ ...s, aiPaymentMode: 'shared-balance' }))}
                      />
                      <div>
                        <strong>Единый баланс Nova</strong>
                        <p>
                          Мы обеспечиваем отказоустойчивые шлюзы LLM, мониторинг и закрывающие документы по факту.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`ai-mode-card ${state.aiPaymentMode === 'own-account' ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="ai_mode"
                        value="own-account"
                        checked={state.aiPaymentMode === 'own-account'}
                        onChange={() => setState(s => ({ ...s, aiPaymentMode: 'own-account' }))}
                      />
                      <div>
                        <strong>Свой API-ключ</strong>
                        <p>
                          Прямой расчёт с поставщиками (OpenAI, Anthropic, DeepSeek). Комиссия Nova за токены — 0%.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`ai-mode-card ${state.aiPaymentMode === 'later' ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="ai_mode"
                        value="later"
                        checked={state.aiPaymentMode === 'later'}
                        onChange={() => setState(s => ({ ...s, aiPaymentMode: 'later' }))}
                      />
                      <div>
                        <strong>Уточнить позже</strong>
                        <p>Выбрать модель и лимиты в процессе технического аудита с инженером.</p>
                      </div>
                    </label>
                  </div>

                  <div className="notice-box">
                    <CircleAlert size={18} />
                    <span>
                      Внимание: фиксированный безлимитный расход AI не предоставляется. Фактический расход токенов
                      зависит от длины контекста, частоты поисков RAG и генерации медиа.
                    </span>
                  </div>
                </section>
              )}

              {/* Нижняя панель навигации по шагам */}
              <div className="wizard-controls">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={currentStep === 1}
                  onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
                >
                  ← Назад
                </button>

                {currentStep < 6 ? (
                  <button
                    type="button"
                    className="primary-button gold-btn"
                    onClick={() => handleStepChange(Math.min(6, currentStep + 1))}
                  >
                    Далее →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button gold-btn"
                    onClick={() => setLeadModalOpen(true)}
                  >
                    Оформить заявку
                  </button>
                )}
              </div>
            </div>

            {/* ПРАВАЯ ЛИПКАЯ ПАНЕЛЬ СВОДКИ (Sticky Summary) */}
            <aside className="construct-sidebar">
              <div className="summary-sticky-card">
                <div className="summary-head">
                  <div className="summary-head-top">
                    <span className="summary-label">ИТОГОВАЯ КОНФИГУРАЦИЯ</span>
                    <span className="summary-live-badge"><span className="pulse-dot" /></span>
                  </div>
                  <h3>Сводка расчёта</h3>
                </div>

                <div className="summary-product">
                  <div className="summary-prod-badge-row">
                    <span className="prod-chip">{selectedProduct.title}</span>
                    {isBundle && (
                      <span className="roles-count-pill">
                        {selectedSpecs.length} {selectedSpecs.length === 1 ? 'роль' : selectedSpecs.length < 5 ? 'роли' : 'ролей'}
                      </span>
                    )}
                  </div>
                  <p>{selectedProduct.subtitle}</p>
                  {isBundle && selectedSpecs.length > 1 ? (
                    <div className="summary-bundle-roles">
                      <span className="bundle-roles-title">Роли в связке ({selectedSpecs.length}):</span>
                      <ul className="bundle-roles-list">
                        {selectedSpecs.map((sp, idx) => (
                          <li key={idx} className="bundle-role-item">
                            <span className="role-bullet">✦</span>
                            <span>{sp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <small className="summary-spec">{state.agentSpecialization}</small>
                  )}
                </div>

                {pricing.requiresIndividualEstimate ? (
                  <div className="individual-alert-panel">
                    <div className="alert-head">
                      <CircleAlert size={18} />
                      <strong>Требуется индивидуальная оценка</strong>
                    </div>
                    <p>
                      Автоматический расчёт приостановлен из-за нестандартной сложности архитектуры:
                    </p>
                    <div className="reasons-list">
                      {pricing.estimateReasons.map((reason, idx) => (
                        <div key={idx} className="reason-item">
                          • {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="summary-figures">
                    <div className="price-row main-price">
                      <div>
                        <span>Разовый запуск</span>
                        <small>Настройка и коннекторы</small>
                      </div>
                      <strong>{pricing.setupPrice?.toLocaleString('ru-RU')} ₽</strong>
                    </div>

                    <div className="price-row main-price">
                      <div>
                        <span>Ежемесячно</span>
                        <small>Поддержка, места, серверы</small>
                      </div>
                      <strong className="gold-text">
                        {pricing.monthlyPrice?.toLocaleString('ru-RU')} ₽/мес
                      </strong>
                    </div>

                    <div className="price-row total-first-period">
                      <div>
                        <span>Первый период</span>
                        <small>Запуск + 1-й месяц</small>
                      </div>
                      <strong className="total-highlight">
                        {pricing.firstPeriodTotal?.toLocaleString('ru-RU')} ₽
                      </strong>
                    </div>

                    {pricing.aiBudgetEstimateMonthly !== null && (
                      <div className="price-row ai-row">
                        <div>
                          <span>Ориентир AI-бюджета</span>
                          <small>Токены (по факту)</small>
                        </div>
                        <span>~{pricing.aiBudgetEstimateMonthly?.toLocaleString('ru-RU')} ₽/мес</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="summary-breakdown">
                  <div className="breakdown-title">Параметры конфигурации:</div>
                  <ul className="breakdown-list">
                    <li>
                      <span>Интеграции</span>
                      <strong>{state.integrationIds.length} шт.</strong>
                    </li>
                    <li>
                      <span>Сотрудники</span>
                      <strong>
                        {state.employeeCount} чел. ({state.adminCount} админ)
                      </strong>
                    </li>
                    <li>
                      <span>Хранилище</span>
                      <strong>{state.storageGb} GB</strong>
                    </li>
                    {state.manualDocProcessing && (
                      <li>
                        <span>Подготовка методистом</span>
                        <strong>Да</strong>
                      </li>
                    )}
                    {state.largeArchiveRecognition && (
                      <li>
                        <span>Распознавание OCR</span>
                        <strong>Да</strong>
                      </li>
                    )}
                    {state.customImport && (
                      <li>
                        <span className="gold-text">Нестандартный импорт</span>
                        <strong>Да</strong>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="summary-actions">
                  <button
                    className="btn-primary-gold full-width"
                    onClick={() => setLeadModalOpen(true)}
                  >
                    {pricing.requiresIndividualEstimate
                      ? 'Запросить индивидуальный расчёт'
                      : 'Оформить заявку'}
                  </button>
                </div>

                <div className="disclaimer-text">
                  * Предварительный расчёт не является публичной офертой. Окончательные параметры
                  фиксируются в техническом задании.
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Адаптивная плавающая панель сводки расчёта (всегда на виду при скролле конфигурации) */}
        <div className="construct-floating-bar">
          <div className="floating-bar-info">
            <div className="floating-bar-title">
              <span className="floating-prod-chip">{selectedProduct.title}</span>
              {isBundle && (
                <span className="floating-roles-tag">{selectedSpecs.length} роли</span>
              )}
            </div>
            <div className="floating-bar-prices">
              {pricing.requiresIndividualEstimate ? (
                <span className="floating-spec-text">Индивидуальный расчёт</span>
              ) : (
                <>
                  <span className="floating-price">
                    Запуск: <strong>{pricing.setupPrice?.toLocaleString('ru-RU')} ₽</strong>
                  </span>
                  <span className="floating-dot">•</span>
                  <span className="floating-price">
                    Месяц: <strong className="gold-text">{pricing.monthlyPrice?.toLocaleString('ru-RU')} ₽/мес</strong>
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="primary-button gold-btn floating-bar-cta"
            onClick={() => setLeadModalOpen(true)}
          >
            {pricing.requiresIndividualEstimate ? 'Индивидуальный расчёт' : 'Оформить заявку'}
          </button>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ОФОРМЛЕНИЯ ЗАЯВКИ / КП (появляется сверху) */}
      {leadModalOpen && (
        <div
          className="modal-backdrop lead-modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget && !leadSubmitting) {
              setLeadModalOpen(false)
            }
          }}
        >
          <div className="modal lead-modal lead-modal-top">
            <div className="modal-head">
              <div>
                <span className="section-label">NOVA / COMMERCIAL PROPOSAL</span>
                <h3>Оформление заявки</h3>
                <p>
                  Зафиксируйте конфигурацию и мгновенно сформируйте официальное коммерческое предложение.
                </p>
              </div>
              <button
                type="button"
                className="icon-button ghost builder-close-btn"
                onClick={() => setLeadModalOpen(false)}
                title="Закрыть окно (Esc)"
              >
                <X size={22} />
              </button>
            </div>

            {leadSuccess ? (
              <div className="lead-success-box">
                <CheckCircle2 size={44} color="var(--accent-gold)" />
                <h4>Заявка успешно зафиксирована!</h4>
                <p>
                  Конфигурация зарегистрирована для <strong>{contactEmail || contactPhone}</strong>. Наш AI-архитектор
                  свяжется с вами в течение 30 минут.
                </p>

                <div className="lead-success-actions">
                  <button
                    className="primary-button gold-btn"
                    onClick={() => {
                      setLeadModalOpen(false)
                      setViewingKpModal(true)
                    }}
                  >
                    <FileText size={16} /> Посмотреть и скачать КП
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setLeadSuccess(false)
                      setLeadModalOpen(false)
                    }}
                  >
                    Вернуться в конструктор
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="lead-form">
                <div className="form-grid">
                  <label className="field-group">
                    <span className="field-label">Ваше имя *</span>
                    <input
                      className="form-input"
                      required
                      placeholder="Алексей Смирнов"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                  </label>
                  <label className="field-group">
                    <span className="field-label">Телефон / Telegram *</span>
                    <input
                      className="form-input"
                      required
                      placeholder="+7 (999) 000-00-00 или @username"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label className="field-group">
                    <span className="field-label">Рабочий Email *</span>
                    <input
                      className="form-input"
                      type="email"
                      required
                      placeholder="alex@company.ru"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                    />
                  </label>
                  <label className="field-group">
                    <span className="field-label">Компания / Проект</span>
                    <input
                      className="form-input"
                      placeholder="ООО Предприятие"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </label>
                </div>

                <label className="field-group full-width-field">
                  <span className="field-label">Комментарий или особые требования</span>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Укажите специфику баз данных, регламентов или интеграций..."
                    value={state.clientComment}
                    onChange={e => setState(s => ({ ...s, clientComment: e.target.value }))}
                  />
                </label>

                <label className="checkbox-kp">
                  <input
                    type="checkbox"
                    checked={wantsKpDownload}
                    onChange={e => setWantsKpDownload(e.target.checked)}
                  />
                  <span>Сформировать PDF коммерческого предложения с расшифровкой сметы</span>
                </label>

                {pricing.requiresIndividualEstimate && (
                  <div className="warning-note">
                    Внимание: конфигурация включает опции с индивидуальной оценкой. Мы свяжемся для
                    проведения бесплатного технического брифинга.
                  </div>
                )}

                {leadError && <div className="error-box">{leadError}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setLeadModalOpen(false)}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="primary-button gold-btn"
                    disabled={leadSubmitting}
                  >
                    {leadSubmitting ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ПРОСМОТРА И ПЕЧАТИ КП */}
      {viewingKpModal && lastSubmittedLead && (
        <CommercialProposalModal
          lead={lastSubmittedLead}
          config={config}
          pricing={pricing}
          onClose={() => setViewingKpModal(false)}
        />
      )}
    </div>
  )
}
