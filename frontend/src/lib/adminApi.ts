// Boshqaruv sahifasi uchun API (token bilan). Ochiq sayt kodidan alohida.
import { API_URL } from './config'

export interface AdminOrder {
  id: string
  created_at: string
  kind: 'order' | 'demo'
  status: string
  status_changed_at: string | null
  admin_note: string
  name: string
  phone: string
  telegram: string
  service_type: string
  package: string
  budget_range: string
  description: string
  file_url: string
  school_name: string
  student_count: number | null
  current_system: string
  notified_at: string | null
  notify_error: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

const KEY = 'izdoshlar_admin_token'

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function storeToken(token: string, remember: boolean) {
  try {
    ;(remember ? localStorage : sessionStorage).setItem(KEY, token)
  } catch {
    /* brauzer saqlashga ruxsat bermasa, sessiya shu sahifada qoladi */
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
  } catch {
    /* eʼtiborsiz */
  }
}

async function call(path: string, token: string | null, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  })
  if (!res.ok) throw new ApiError(res.status)
  return res
}

export async function login(username: string, password: string, remember: boolean) {
  const res = await call('/auth/token/', null, { method: 'POST', body: JSON.stringify({ username, password }) })
  const { token } = (await res.json()) as { token: string }
  storeToken(token, remember)
  return token
}

export async function logout(token: string) {
  try {
    await call('/auth/logout/', token, { method: 'POST' })
  } finally {
    clearToken()
  }
}

export async function fetchOrders(token: string): Promise<AdminOrder[]> {
  return (await call('/admin/orders/', token)).json()
}

export async function updateOrder(token: string, id: string, patch: Partial<Pick<AdminOrder, 'status' | 'admin_note'>>): Promise<AdminOrder> {
  return (await call(`/admin/orders/${id}/`, token, { method: 'PATCH', body: JSON.stringify(patch) })).json()
}
