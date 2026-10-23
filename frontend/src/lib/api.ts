// Maʼlumot qatlami. Kontent Django REST APIʼdan olinadi (build vaqtida prerender uchun,
// brauzerda sahifalar orasida oʻtishda yangilanadi). API javob bermasa, repo ichidagi
// data/*.json va content/blog/*.md fayllari zaxira sifatida ishlatiladi.
import packagesData from '../data/packages.json'
import faqData from '../data/faq.json'
import projectsData from '../data/projects.json'
import testimonialsData from '../data/testimonials.json'
import { localPosts, toPost, type ApiPost, type Post } from './blog'
import { API_URL } from './config'

export interface Project {
  slug: string
  title: string
  category: string
  summary: string
  problem: string
  solution: string
  result: string
  tech: string[]
  cover?: string
  screenshots: string[]
  featured: boolean
  placeholder?: boolean
}
export interface Pkg {
  key: string
  name: string
  tagline: string
  price: string
  popular: boolean
  features: string[]
}
export interface ComparisonRow {
  label: string
  values: (boolean | string)[]
}
export interface AddOn {
  name: string
  text: string
  price: string
}
export interface FaqItem {
  scope: string
  q: string
  a: string
}
export interface Testimonial {
  author: string
  role: string
  text: string
}
export interface PricingData {
  packages: Pkg[]
  comparison: ComparisonRow[]
  addons: AddOn[]
}

/** APIʼdan oʻqiydi. Xato boʻlsa zaxira qiymatni qaytaradi (VITE_REQUIRE_API=1 boʻlsa build toʻxtaydi). */
async function request<T>(path: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw lastErr
}

// Build (Node) vaqtida har bir manzil bir marta soʻraladi; brauzerda har safar yangi maʼlumot olinadi
const buildCache = new Map<string, Promise<unknown>>()

async function fetchApi<T>(path: string, fallback: () => T): Promise<T> {
  if (!API_URL) return fallback()
  try {
    if (typeof window !== 'undefined') return await request<T>(path)
    if (!buildCache.has(path)) buildCache.set(path, request<T>(path))
    return (await buildCache.get(path)) as T
  } catch (err) {
    if (import.meta.env.VITE_REQUIRE_API === '1') throw err
    console.warn(`[api] ${path} olinmadi, zaxira kontent ishlatildi:`, (err as Error).message)
    return fallback()
  }
}

export const getProjects = () => fetchApi<Project[]>('/projects/', () => projectsData as Project[])
export const getFeaturedProjects = async () => (await getProjects()).filter((p) => p.featured)
export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null
}
export const getPricing = async (): Promise<PricingData> => {
  const [packages, comparison, addons] = await Promise.all([
    fetchApi<Pkg[]>('/packages/', () => packagesData.packages as Pkg[]),
    fetchApi<ComparisonRow[]>('/comparison/', () => packagesData.comparison as ComparisonRow[]),
    fetchApi<AddOn[]>('/addons/', () => packagesData.addons),
  ])
  return { packages, comparison, addons }
}
export const getFaq = (scope: string) =>
  fetchApi<FaqItem[]>(`/faq/?scope=${scope}`, () => (faqData as FaqItem[]).filter((f) => f.scope === scope))
export const getTestimonials = () =>
  fetchApi<Testimonial[]>('/testimonials/', () => testimonialsData.filter((t) => !('placeholder' in t && t.placeholder)))

export async function getPosts(): Promise<Post[]> {
  const posts = await fetchApi<ApiPost[] | null>('/posts/', () => null)
  return posts ? posts.map(toPost) : localPosts
}
export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug) ?? null
}

// ---------- Buyurtma yuborish ----------
export interface OrderPayload {
  kind: 'order' | 'demo'
  name: string
  phone: string
  telegram: string
  audience: 'school' | 'business'
  service_type: string
  package: string
  budget_range: string
  description: string
  file_url: string
  school_name: string
  student_count: number | null
  current_system: string
  source_page: string
  website: string // honeypot
  opened_at: number
  consent: boolean
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: 'validation'; fields: Record<string, string> }
  | { ok: false; reason: 'rate_limit' | 'network' | 'server' }

export async function submitOrder(payload: OrderPayload): Promise<SubmitResult> {
  if (!API_URL) return { ok: false, reason: 'network' }
  try {
    const res = await fetch(`${API_URL}/orders/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) return { ok: true }
    if (res.status === 429) return { ok: false, reason: 'rate_limit' }
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}))
      const fields: Record<string, string> = {}
      for (const [k, v] of Object.entries(body)) fields[k] = Array.isArray(v) ? String(v[0]) : String(v)
      return { ok: false, reason: 'validation', fields }
    }
    return { ok: false, reason: 'server' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
