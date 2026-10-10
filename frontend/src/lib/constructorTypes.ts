export type ProductType = 'single' | 'bundle' | 'custom' | 'consultation'

export type IntegrationCategory = 'messenger' | 'social' | 'email' | 'crm' | 'publishing' | 'custom'
export type IntegrationLevel = 1 | 2 | 3 | 'individual'

export interface Product {
  id: string
  type: ProductType
  title: string
  subtitle: string
  description: string
  baseSetupPrice: number
  baseMonthlyPrice: number
  badge?: string
  includedAdminCount: number
  includedStorageGb: number
  allowedFeatureIds: string[]
}

export interface Integration {
  id: string
  title: string
  category: IntegrationCategory
  level: IntegrationLevel
  description: string
  setupPrice: number
  monthlyPrice: number
  hasReadyConnector: boolean
  requiresAccessGrant: boolean
  requiresIndividualEstimate?: boolean
  restrictionsNote?: string
}

export interface Feature {
  id: string
  title: string
  description: string
  category: 'core' | 'knowledge' | 'publishing' | 'automation'
  setupPrice: number
  monthlyPrice: number
  requiresIndividualEstimate?: boolean
  isHardScenario?: boolean
}

export interface PricingConfig {
  maxAutoIntegrationsThreshold: number
  extraEmployeeMonthlyPrice: number
  extraStoragePerGbMonthlyPrice: number
  manualDocumentPrepPrice: number
  archiveProcessingPrice: number
  levelPrices: {
    1: { setup: number; monthly: number }
    2: { setup: number; monthly: number }
    3: { setup: number; monthly: number }
  }
  products: Product[]
  features: Feature[]
  integrations: Integration[]
}

export interface AccessRightsOptions {
  personalHistory: boolean
  companyKnowledgeBase: boolean
  individualKnowledgeBase: boolean
  rbacRestrictions: boolean
}

export interface PublishingOptions {
  publishText: boolean
  publishMedia: boolean
  commentModeration: boolean
  collectStats: boolean
}

export interface ConstructorState {
  productId: string
  agentSpecialization: string
  featureIds: string[]
  integrationIds: string[]
  employeeCount: number
  adminCount: number
  accessRights: AccessRightsOptions
  publishingOptions: PublishingOptions
  storageGb: number
  fileCountEstimate: number
  manualDocProcessing: boolean
  customImport: boolean
  largeArchiveRecognition: boolean
  aiPaymentMode: 'own-account' | 'shared-balance' | 'later'
  clientComment: string
}

export interface PriceResult {
  setupPrice: number | null
  monthlyPrice: number | null
  firstPeriodTotal: number | null
  aiBudgetEstimateMonthly: number | null
  requiresIndividualEstimate: boolean
  estimateReasons: string[]
  warnings: string[]
  breakdown: {
    baseSetup: number
    integrationsSetup: number
    featuresSetup: number
    manualPrepSetup: number
    baseMonthly: number
    employeesMonthly: number
    storageMonthly: number
    integrationsMonthly: number
    featuresMonthly: number
  }
}

export interface LeadSubmission {
  id?: string
  contactName: string
  contactPhone: string
  contactEmail: string
  companyName?: string
  wantsKpDownload: boolean
  state: ConstructorState
  pricingSummary: PriceResult
  createdAt?: string
}
