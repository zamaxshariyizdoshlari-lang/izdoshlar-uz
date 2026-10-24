// Boshqaruv sahifasi uchun API: Supabase Auth + PostgREST + Storage. Ochiq sayt kodidan alohida
// (faqat /boshqaruv sahifasi yuklanganda kiradi). Huquqlarni brauzer emas, bazadagi RLS belgilaydi.
import { SUPABASE_URL, supabaseHeaders } from './config'

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

// ---------- Sessiya ----------
interface Session {
  access_token: string
  refresh_token: string
  expires_at: number // epoch sekund
}

const KEY = 'izdoshlar_admin_session'

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function storeSession(s: Session, remember: boolean) {
  try {
    ;(remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s))
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

export function getToken(): string | null {
  return readSession()?.access_token ?? null
}

export async function raw(path: string, init: RequestInit & { token?: string | null } = {}) {
  const { token, headers, ...rest } = init
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...rest,
    headers: {
      ...supabaseHeaders(token ?? undefined),
      ...(rest.body && !(rest.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res
}

/** Token muddati tugashiga 90 soniya qolsa yangilaydi. Yangilab boʻlmasa null (qayta kirish kerak). */
export async function ensureFreshToken(): Promise<string | null> {
  const s = readSession()
  if (!s) return null
  if (s.expires_at - Date.now() / 1000 > 90) return s.access_token
  try {
    const res = await raw('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    })
    const j = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
    const remember = (() => {
      try {
        return localStorage.getItem(KEY) !== null
      } catch {
        return false
      }
    })()
    storeSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() / 1000 + j.expires_in }, remember)
    return j.access_token
  } catch {
    clearToken()
    return null
  }
}

export async function login(email: string, password: string, remember: boolean): Promise<string> {
  const res = await raw('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const j = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
  // Faqat `admins` jadvalidagilar kira oladi
  const isAdmin = await raw('/rest/v1/rpc/am_i_admin', { method: 'POST', token: j.access_token, body: '{}' }).then((r) => r.json())
  if (isAdmin !== true) {
    await raw('/auth/v1/logout', { method: 'POST', token: j.access_token }).catch(() => {})
    throw new ApiError(403)
  }
  storeSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() / 1000 + j.expires_in }, remember)
  return j.access_token
}

export async function logout(token: string) {
  try {
    await raw('/auth/v1/logout', { method: 'POST', token })
  } finally {
    clearToken()
  }
}

// ---------- Buyurtmalar ----------
const ORDER_COLS =
  'id,created_at,kind,status,status_changed_at,admin_note,name,phone,telegram,service_type,package,budget_range,description,file_url,school_name,student_count,current_system,notified_at,notify_error'

export async function fetchOrders(token: string): Promise<AdminOrder[]> {
  return (await raw(`/rest/v1/orders?select=${ORDER_COLS}&order=created_at.desc&limit=500`, { token })).json()
}

export async function updateOrder(
  token: string,
  id: string,
  patch: Partial<Pick<AdminOrder, 'status' | 'admin_note'>>,
): Promise<AdminOrder> {
  const res = await raw(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=${ORDER_COLS}`, {
    method: 'PATCH',
    token,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  })
  const rows = (await res.json()) as AdminOrder[]
  if (!rows.length) throw new ApiError(403) // RLS: yozuv topilmadi yoki ruxsat yoʻq
  return rows[0]
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

export interface ProductInput {
  title: string
  description: string
  category: string
  price: string
  published: boolean
  order: number
  file: File | null
  removeCover: boolean
}

const PRODUCT_COLS = 'id,slug,title,description,category,price_text,cover_url,published,sort_order'
const PUBLIC_MEDIA = `${SUPABASE_URL}/storage/v1/object/public/media/`
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toProduct = (r: Record<string, any>): AdminProduct => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  description: r.description,
  category: r.category,
  price: r.price_text,
  cover: r.cover_url || null,
  published: r.published,
  order: r.sort_order,
})

const mediaPath = (url: string | null) => (url && url.startsWith(PUBLIC_MEDIA) ? url.slice(PUBLIC_MEDIA.length) : null)

async function uploadCover(token: string, file: File): Promise<{ url: string; path: string }> {
  const ext = EXT[file.type]
  if (!ext) throw new ApiError(415)
  const path = `products/${crypto.randomUUID()}.${ext}`
  await raw(`/storage/v1/object/media/${path}`, {
    method: 'POST',
    token,
    body: file,
    headers: { 'Content-Type': file.type, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
  })
  return { url: PUBLIC_MEDIA + path, path }
}

const removeObject = (token: string, path: string | null) =>
  path ? raw(`/storage/v1/object/media/${path}`, { method: 'DELETE', token }).catch(() => {}) : Promise.resolve()

export async function fetchProducts(token: string): Promise<AdminProduct[]> {
  const rows = await (await raw(`/rest/v1/products?select=${PRODUCT_COLS}&order=sort_order.asc,id.asc`, { token })).json()
  return rows.map(toProduct)
}

/** Yaratadi yoki yangilaydi; rasmni yuklaydi, eskisini oʻchiradi. Baza xatosida yangi rasm ham oʻchiriladi. */
export async function saveProduct(token: string, existing: AdminProduct | null, input: ProductInput): Promise<AdminProduct> {
  const oldPath = mediaPath(existing?.cover ?? null)
  let cover_url = existing?.cover ?? ''
  let uploaded: string | null = null

  if (input.file) {
    const up = await uploadCover(token, input.file)
    cover_url = up.url
    uploaded = up.path
  } else if (input.removeCover) {
    cover_url = ''
  }

  const body = JSON.stringify({
    title: input.title,
    description: input.description,
    category: input.category,
    price_text: input.price,
    published: input.published,
    sort_order: input.order,
    cover_url,
  })
  try {
    const res = existing
      ? await raw(`/rest/v1/products?id=eq.${existing.id}&select=${PRODUCT_COLS}`, {
          method: 'PATCH', token, body, headers: { Prefer: 'return=representation' },
        })
      : await raw(`/rest/v1/products?select=${PRODUCT_COLS}`, {
          method: 'POST', token, body, headers: { Prefer: 'return=representation' },
        })
    const rows = (await res.json()) as Record<string, unknown>[]
    if (!rows.length) throw new ApiError(403)
    if (oldPath && (input.file || input.removeCover)) await removeObject(token, oldPath)
    return toProduct(rows[0])
  } catch (err) {
    await removeObject(token, uploaded)
    throw err
  }
}

export async function setProductPublished(token: string, id: number, published: boolean): Promise<AdminProduct> {
  const res = await raw(`/rest/v1/products?id=eq.${id}&select=${PRODUCT_COLS}`, {
    method: 'PATCH', token, body: JSON.stringify({ published }), headers: { Prefer: 'return=representation' },
  })
  const rows = (await res.json()) as Record<string, unknown>[]
  if (!rows.length) throw new ApiError(403)
  return toProduct(rows[0])
}

export async function deleteProduct(token: string, product: AdminProduct): Promise<void> {
  const res = await raw(`/rest/v1/products?id=eq.${product.id}&select=id`, {
    method: 'DELETE', token, headers: { Prefer: 'return=representation' },
  })
  if (!((await res.json()) as unknown[]).length) throw new ApiError(403)
  await removeObject(token, mediaPath(product.cover))
}
