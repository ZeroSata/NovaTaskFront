import type { ConstructorState, PricingConfig, PriceResult } from './constructorTypes'

export function calculatePrice(state: ConstructorState, config: PricingConfig): PriceResult {
  const warnings: string[] = []
  const estimateReasons: string[] = []

  const product = config.products.find(p => p.id === state.productId) ?? config.products[0]

  // Если выбрана консультация по подбору
  if (product.type === 'consultation') {
    return {
      setupPrice: 0,
      monthlyPrice: 0,
      firstPeriodTotal: 0,
      aiBudgetEstimateMonthly: null,
      requiresIndividualEstimate: false,
      estimateReasons: [],
      warnings: ['Формат «Консультация по подбору»: персональный архитектурный аудит проводится бесплатно.'],
      breakdown: {
        baseSetup: 0,
        integrationsSetup: 0,
        featuresSetup: 0,
        manualPrepSetup: 0,
        baseMonthly: 0,
        employeesMonthly: 0,
        storageMonthly: 0,
        integrationsMonthly: 0,
        featuresMonthly: 0,
      },
    }
  }

  // 1. Проверка условий перехода в индивидуальный расчёт (по ТЗ Раздел 5.5)
  // Правило 1: Превышение порога интеграций
  if (state.integrationIds.length > config.maxAutoIntegrationsThreshold) {
    estimateReasons.push(
      `Выбрано ${state.integrationIds.length} интеграций (лимит автоматического расчёта — ${config.maxAutoIntegrationsThreshold} шт.). Архитектура требует согласования пропускной способности.`
    )
  }

  // Правило 2: Нестандартный импорт данных
  if (state.customImport) {
    estimateReasons.push('Выбран «Нестандартный импорт данных»: требуется ручной анализ форматов, СУБД и структур.')
  }

  // Правило 3: Выбран продукт custom
  if (product.type === 'custom') {
    estimateReasons.push('Выбран формат «Индивидуальное решение»: архитектура проектируется индивидуально под задачи предприятия.')
  }

  // Правило 4: Индивидуальные интеграции
  const selectedIntegrations = config.integrations.filter(i => state.integrationIds.includes(i.id))
  selectedIntegrations.forEach(i => {
    if (i.requiresIndividualEstimate || i.level === 'individual') {
      estimateReasons.push(`Индивидуальное подключение: «${i.title}».`)
    }
  })

  // Правило 5: Сложные индивидуальные сценарии
  const selectedFeatures = config.features.filter(f => state.featureIds.includes(f.id))
  selectedFeatures.forEach(f => {
    if (f.requiresIndividualEstimate) {
      estimateReasons.push(`Сложный кастомный сценарий: «${f.title}».`)
    }
  })

  // 2. Разовый запуск (Setup)
  const baseSetup = product.baseSetupPrice

  let integrationsSetup = 0
  selectedIntegrations.forEach(i => {
    if (typeof i.level === 'number') {
      const levelCfg = config.levelPrices[i.level]
      integrationsSetup += levelCfg?.setup ?? i.setupPrice
    } else {
      integrationsSetup += i.setupPrice
    }
  })

  let featuresSetup = 0
  selectedFeatures.forEach(f => {
    featuresSetup += f.setupPrice
  })

  let manualPrepSetup = 0
  if (state.manualDocProcessing) {
    manualPrepSetup += config.manualDocumentPrepPrice
  }
  if (state.largeArchiveRecognition) {
    manualPrepSetup += config.archiveProcessingPrice
  }

  const totalSetup = baseSetup + integrationsSetup + featuresSetup + manualPrepSetup

  // 3. Ежемесячное обслуживание (Monthly)
  const baseMonthly = product.baseMonthlyPrice

  // Дополнительные сотрудники (1 админ включен)
  const extraEmployees = Math.max(0, state.employeeCount - product.includedAdminCount)
  const employeesMonthly = extraEmployees * config.extraEmployeeMonthlyPrice

  // Дополнительное хранение
  const extraStorageGb = Math.max(0, state.storageGb - product.includedStorageGb)
  const storageMonthly = extraStorageGb * config.extraStoragePerGbMonthlyPrice

  let integrationsMonthly = 0
  selectedIntegrations.forEach(i => {
    if (typeof i.level === 'number') {
      const levelCfg = config.levelPrices[i.level]
      integrationsMonthly += levelCfg?.monthly ?? i.monthlyPrice
    } else {
      integrationsMonthly += i.monthlyPrice
    }
  })

  let featuresMonthly = 0
  selectedFeatures.forEach(f => {
    featuresMonthly += f.monthlyPrice
  })

  const totalMonthly = baseMonthly + employeesMonthly + storageMonthly + integrationsMonthly + featuresMonthly

  // Итоговая сумма за первый период (Запуск + 1-й месяц обслуживания по ТЗ Раздел 3.4)
  const totalFirstPeriod = totalSetup + totalMonthly

  // 4. Оценка расходов на AI (токены)
  let aiBudgetEstimate: number | null = null
  if (state.aiPaymentMode === 'shared-balance') {
    aiBudgetEstimate = Math.round(
      (state.employeeCount * 1200 + selectedIntegrations.length * 1000 + state.storageGb * 35) / 100
    ) * 100
    warnings.push('Ориентир AI-бюджета рассчитывается по факту фактического потребления токенов моделями.')
  } else if (state.aiPaymentMode === 'own-account') {
    aiBudgetEstimate = null
    warnings.push('Токены оплачиваются вами напрямую провайдеру LLM (OpenAI, Anthropic). Комиссия Nova — 0%.')
  } else {
    aiBudgetEstimate = null
    warnings.push('Модель расчёта и лимиты AI-бюджета будут согласованы в техническом задании.')
  }

  warnings.push('Безлимитный расход токенов не предоставляется. Фактический расход зависит от интенсивности запросов и объема RAG-документов.')

  const isIndividual = estimateReasons.length > 0

  return {
    setupPrice: isIndividual ? null : totalSetup,
    monthlyPrice: isIndividual ? null : totalMonthly,
    firstPeriodTotal: isIndividual ? null : totalFirstPeriod,
    aiBudgetEstimateMonthly: isIndividual ? null : aiBudgetEstimate,
    requiresIndividualEstimate: isIndividual,
    estimateReasons,
    warnings,
    breakdown: {
      baseSetup,
      integrationsSetup,
      featuresSetup,
      manualPrepSetup,
      baseMonthly,
      employeesMonthly,
      storageMonthly,
      integrationsMonthly,
      featuresMonthly,
    },
  }
}
