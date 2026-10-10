/**
 * Модуль аналитических событий по ТЗ (Раздел 14).
 * Конфиденциальные данные, токены, API-ключи и персональные данные клиентов не передаются.
 */

export type AnalyticsEvent =
  | { type: 'CONSTRUCTOR_OPEN'; source?: string }
  | { type: 'CONSTRUCTOR_CLOSE' }
  | { type: 'PRODUCT_SELECT'; productId: string }
  | { type: 'STEP_CHANGE'; fromStep: number; toStep: number }
  | { type: 'INTEGRATION_ADD'; integrationId: string }
  | { type: 'INTEGRATION_REMOVE'; integrationId: string }
  | { type: 'INDIVIDUAL_ESTIMATE_TRIGGERED'; reasonsCount: number }
  | { type: 'FORM_START' }
  | { type: 'LEAD_SUBMIT_SUCCESS'; wantsKp: boolean }
  | { type: 'LEAD_SUBMIT_ERROR'; error: string }
  | { type: 'CONFIG_RESET' }
  | { type: 'KP_VIEW_OR_DOWNLOAD' }

export function trackEvent(event: AnalyticsEvent) {
  // Логирование событий для отладки и отправки на телеметрический шлюз (без PII)
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nova_analytics', { detail: event }))
    }
  } catch {}
}
