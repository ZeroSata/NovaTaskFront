import type { ConstructorState, LeadSubmission, PricingConfig, PriceResult } from './constructorTypes'
import { defaultPricingConfig } from './pricingConfig'
import { calculatePrice } from './pricingCalculator'

export type AgentPermission = 'smm' | 'methodologist' | 'analyst'
export type VmStatus = 'ACTIVE' | 'RESTARTING' | 'DISABLED' | 'CREATING' | 'ERROR'

export interface User {
  id: number
  name: string
  email: string
  phone_number?: string | null
  created_at: string
  is_staff: boolean
}

export interface Agent {
  id: number
  user_id: number
  agent_name: string
  agent_description?: string | null
  agent_vm_id: number
  created_at: string
  agent_permission: AgentPermission
}

export interface Vm {
  id: number
  vm_proxmox_id: number
  ipv4?: string | null
  ipv6?: string | null
  title: string
  description?: string | null
  status: VmStatus
  cores: number
  ram: number
  rom: number
  ostype: number
}

export interface Backlog {
  id: number
  staff_id: number
  vm_id: number
  message: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

const base = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'nova_access_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
  }
  const res = await fetch(`${base}${path}`, { ...init, headers })
  if (!res.ok) {
    let message = `API error ${res.status}`
    try {
      const body = await res.json()
      message = body.error ?? message
    } catch {}
    if (res.status === 401) clearToken()
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Аутентификация и пользователи
  login: async (email: string, password: string) => {
    const result = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(result.access_token)
    return result
  },
  me: () => request<User>('/me'),
  logout: () => clearToken(),
  users: () => request<User[]>('/users'),
  agents: (userId: number) => request<Agent[]>(`/users/${userId}/agents`),
  vm: (id: number) => request<Vm>(`/vms/${id}`),
  vmsByStatus: (status: string) => request<Vm[]>(`/vms/status/${status.toLowerCase()}`),
  connections: (vmId: number) => request<Backlog[]>(`/vms/${vmId}/connections`),
  createAgent: (userId: number, data: Partial<Agent>) =>
    request<Agent>(`/users/${userId}/agents`, { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id: number, data: Partial<Agent>) =>
    request<Agent>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createVm: (data: {
    title: string
    description?: string | null
    cores: number
    ram: number
    rom: number
    ostype: number
  }) => request<Vm>('/vms', { method: 'POST', body: JSON.stringify(data) }),
  createUser: (data: {
    name: string
    email: string
    phone_number?: string | null
    telegram_link?: string | null
    whatsapp_link?: string | null
    instagram_link?: string | null
    vk_link?: string | null
    password: string
  }) => request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (
    id: number,
    data: {
      name: string
      email: string
      phone_number?: string | null
      telegram_link?: string | null
      whatsapp_link?: string | null
      instagram_link?: string | null
      vk_link?: string | null
    }
  ) => request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStaff: (id: number, is_staff: boolean) =>
    request<User>(`/users/${id}/staff`, { method: 'PATCH', body: JSON.stringify({ is_staff }) }),
  updateVm: (id: number, data: Partial<Vm>) =>
    request<Vm>(`/vms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // API-контракт Конструктора (Раздел 13)
  construct: {
    getProducts: async () => {
      try {
        return await request<PricingConfig['products']>('/construct/products')
      } catch {
        return defaultPricingConfig.products
      }
    },
    getFeatures: async () => {
      try {
        return await request<PricingConfig['features']>('/construct/features')
      } catch {
        return defaultPricingConfig.features
      }
    },
    getIntegrations: async () => {
      try {
        return await request<PricingConfig['integrations']>('/construct/integrations')
      } catch {
        return defaultPricingConfig.integrations
      }
    },
    getPricingConfig: async () => {
      try {
        return await request<PricingConfig>('/construct/pricing-config')
      } catch {
        return defaultPricingConfig
      }
    },
    validateState: async (state: ConstructorState): Promise<{ valid: boolean; errors: string[]; pricing: PriceResult }> => {
      try {
        return await request('/construct/validate', { method: 'POST', body: JSON.stringify(state) })
      } catch {
        const pricing = calculatePrice(state, defaultPricingConfig)
        return { valid: true, errors: [], pricing }
      }
    },
    submitLead: async (lead: LeadSubmission): Promise<{ success: boolean; leadId: string }> => {
      try {
        return await request('/construct/leads', { method: 'POST', body: JSON.stringify(lead) })
      } catch {
        // Локальное сохранение для надежности при отсутствии сетевого бэкенда
        const id = 'lead-' + Date.now()
        const savedLeads = JSON.parse(localStorage.getItem('nova_saved_leads') || '[]')
        savedLeads.push({ ...lead, id, createdAt: new Date().toISOString() })
        localStorage.setItem('nova_saved_leads', JSON.stringify(savedLeads))
        return { success: true, leadId: id }
      }
    },
    saveDraft: async (state: ConstructorState): Promise<{ draftId: string }> => {
      try {
        return await request('/construct/draft', { method: 'POST', body: JSON.stringify(state) })
      } catch {
        const draftId = 'draft-' + Date.now()
        localStorage.setItem('nova_constructor_draft_' + draftId, JSON.stringify(state))
        return { draftId }
      }
    },
    getDraft: async (id: string): Promise<ConstructorState | null> => {
      try {
        return await request(`/construct/draft/${id}`)
      } catch {
        const raw = localStorage.getItem('nova_constructor_draft_' + id)
        return raw ? JSON.parse(raw) : null
      }
    },
  },
}
