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
  body: unknown
  constructor(status: number, body?: unknown) {
    super(`HTTP ${status}`)
    this.status = status
    this.body = body
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
      // FormData uchun brauzer oʻzi chegarali Content-Type qoʻyadi
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  })
  if (!res.ok) throw new ApiError(res.status, res.status === 400 ? await res.json().catch(() => null) : undefined)
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

// ---------- Mahsulotlar ----------
export interface AdminProduct {
  id: number
  slug: string
  title: string
  description: string
  category: string
  price: string
  cover: string | null
  published: boolean
  order: number
}

export async function fetchProducts(token: string): Promise<AdminProduct[]> {
  return (await call('/admin/products/', token)).json()
}

export async function createProduct(token: string, body: FormData): Promise<AdminProduct> {
  return (await call('/admin/products/', token, { method: 'POST', body })).json()
}

/** `body`: FormData (rasm bilan) yoki JSON satr (masalan, faqat published). */
export async function updateProduct(token: string, id: number, body: FormData | string): Promise<AdminProduct> {
  return (await call(`/admin/products/${id}/`, token, { method: 'PATCH', body })).json()
}

export async function deleteProduct(token: string, id: number): Promise<void> {
  await call(`/admin/products/${id}/`, token, { method: 'DELETE' })
}
