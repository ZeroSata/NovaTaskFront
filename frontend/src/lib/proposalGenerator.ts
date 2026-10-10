import type { ConstructorState, LeadSubmission, PricingConfig, PriceResult } from './constructorTypes'

export function generateCommercialProposal(
  lead: LeadSubmission,
  config: PricingConfig,
  pricing: PriceResult
): string {
  const product = config.products.find(p => p.id === lead.state.productId) ?? config.products[0]
  const selectedFeatures = config.features.filter(f => lead.state.featureIds.includes(f.id))
  const selectedIntegrations = config.integrations.filter(i => lead.state.integrationIds.includes(i.id))

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ: ВНЕДРЕНИЕ AI-РЕШЕНИЯ NOVA
Номер документа: KP-${Date.now().toString().slice(-6)}
Дата формирования: ${dateStr}
Заказчик: ${lead.companyName || 'Индивидуальный заказчик'} (${lead.contactName}, ${lead.contactEmail}, ${lead.contactPhone})

1. ВЫБРАННАЯ АРХИТЕКТУРА И ПРОДУКТ
- Продукт: ${product.title} (${product.subtitle})
- Назначение / Специализация: ${lead.state.agentSpecialization || 'Универсальный корпоративный ассистент'}
- Пользователи и права: ${lead.state.employeeCount} сотрудников (${lead.state.adminCount} администратора)
- Выделенное RAG-хранилище: ${lead.state.storageGb} GB
- Модель AI-бюджета: ${
    lead.state.aiPaymentMode === 'shared-balance'
      ? 'Единый баланс Nova (по факту расхода токенов)'
      : lead.state.aiPaymentMode === 'own-account'
      ? 'Собственный API-ключ заказчика'
      : 'Согласование на техническом аудите'
  }

2. ФУНКЦИОНАЛЬНЫЕ МОДУЛИ (${selectedFeatures.length} шт.):
${selectedFeatures.map(f => `  • ${f.title} — ${f.description}`).join('\n')}

3. ТОЧКИ ПОДКЛЮЧЕНИЯ И КАНАЛЫ СВЯЗИ (${selectedIntegrations.length} шт.):
${selectedIntegrations.map(i => `  • ${i.title} (${i.description}) [${typeof i.level === 'number' ? `Уровень ${i.level}` : 'Индивидуально'}]`).join('\n')}

4. ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ И ПОДГОТОВКА ДАННЫХ:
${lead.state.manualDocProcessing ? '  • Ручная подготовка и очистка регламентов методистом (включено)\n' : ''}${lead.state.largeArchiveRecognition ? '  • Распознавание больших архивов и сканов OCR (включено)\n' : ''}${lead.state.customImport ? '  • Нестандартный импорт из закрытых СУБД (индивидуальное согласование)\n' : ''}${!lead.state.manualDocProcessing && !lead.state.largeArchiveRecognition && !lead.state.customImport ? '  • Самостоятельная загрузка материалов в стандартных форматах\n' : ''}
5. ФИНАНСОВЫЙ РАСЧЁТ:
${
  pricing.requiresIndividualEstimate
    ? `  СТАТУС: ТРЕБУЕТСЯ ИНДИВИДУАЛЬНАЯ АРХИТЕКТУРНАЯ ОЦЕНКА
  Причины индивидуального расчёта:
${pricing.estimateReasons.map(r => `  - ${r}`).join('\n')}
  Ориентировочный срок подготовки точной сметы: 1 рабочий день.`
    : `  • Разовый запуск и интеграция (Setup): ${(pricing.setupPrice ?? 0).toLocaleString('ru-RU')} ₽
  • Ежемесячная техническая поддержка и инфраструктура: ${(pricing.monthlyPrice ?? 0).toLocaleString('ru-RU')} ₽/мес
  • ИТОГО ЗА ПЕРВЫЙ ПЕРИОД (Запуск + 1-й месяц): ${(pricing.firstPeriodTotal ?? 0).toLocaleString('ru-RU')} ₽
  ${pricing.aiBudgetEstimateMonthly ? `• Ориентировочный бюджет токенов LLM: ~${pricing.aiBudgetEstimateMonthly.toLocaleString('ru-RU')} ₽/мес (по факту)` : ''}`
}

6. СРОКИ И ЭТАПЫ ВНЕДРЕНИЯ:
- Экспресс-аудит и фиксация ТЗ: 1-2 рабочих дня
- Развёртывание виртуального контура и коннекторов: 3-5 рабочих дней
- Загрузка базы знаний и настройка промптов: 2-3 рабочих дня
- Тестирование и передача в опытную эксплуатацию: 2 рабочих дня
Общий срок ввода в эксплуатацию: 7-12 рабочих дней.

7. УСЛОВИЯ И ПРИМЕЧАНИЯ:
- Предварительный расчёт не является публичной офертой.
- Окончательный перечень интеграций и SLA фиксируется в договоре.
Nova AI Operations — https://nova-ai.io
`.trim()
}
