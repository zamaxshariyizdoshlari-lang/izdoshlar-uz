// Ochiq maʼlumot qatlami. Kontent Supabase (PostgREST) dan olinadi: build vaqtida prerender uchun,
// brauzerda sahifalar orasida oʻtishda yangilanadi. Supabase sozlanmagan yoki javob bermasa,
// repo ichidagi data/*.json va content/blog/*.md zaxira sifatida ishlatiladi.
import packagesData from '../data/packages.json'
import faqData from '../data/faq.json'
import projectsData from '../data/projects.json'
import testimonialsData from '../data/testimonials.json'
import { localPosts, toPost, type ApiPost, type Post } from './blog'
import { HAS_BACKEND, SUPABASE_URL, supabaseHeaders } from './config'

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
export interface Product {
  slug: string
  title: string
  description: string
  category: string
  price: string
  cover: string
}
export interface PricingData {
  packages: Pkg[]
  comparison: ComparisonRow[]
  addons: AddOn[]
}

async function request<T>(path: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: supabaseHeaders(),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as T
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw lastErr
}

// Build (Node) vaqtida har bir soʻrov bir marta bajariladi; brauzerda har safar yangi maʼlumot olinadi
const buildCache = new Map<string, Promise<unknown>>()

/** Supabase'dan oʻqiydi, `map` bilan frontend shakliga oʻtkazadi. Xato boʻlsa zaxira (VITE_REQUIRE_API=1 boʻlsa build toʻxtaydi). */
async function fetchRows<Row, T>(path: string, map: (rows: Row[]) => T, fallback: () => T): Promise<T> {
  if (!HAS_BACKEND) return fallback()
  try {
    if (typeof window !== 'undefined') return map(await request<Row[]>(path))
    if (!buildCache.has(path)) buildCache.set(path, request<Row[]>(path))
    return map((await buildCache.get(path)) as Row[])
  } catch (err) {
    if (import.meta.env.VITE_REQUIRE_API === '1') throw err
    console.warn(`[api] ${path} olinmadi, zaxira kontent ishlatildi:`, (err as Error).message)
    return fallback()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
const ORDER = 'order=sort_order.asc,id.asc'

export const getProjects = () =>
  fetchRows<Row, Project[]>(
    `projects?select=slug,title,category,summary,problem,solution,result,tech,cover_url,screenshots,featured,placeholder&published=eq.true&${ORDER}`,
    (rows) => rows.map(({ cover_url, ...r }) => ({ ...r, cover: cover_url || undefined }) as Project),
    () => projectsData as Project[],
  )
export const getFeaturedProjects = async () => (await getProjects()).filter((p) => p.featured)
export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null
}

export const getPricing = async (): Promise<PricingData> => {
  const [packages, comparison, addons] = await Promise.all([
    fetchRows<Row, Pkg[]>(
      `packages?select=key,name,tagline,price_text,popular,features&published=eq.true&${ORDER}`,
      (rows) => rows.map(({ price_text, ...r }) => ({ ...r, price: price_text }) as Pkg),
      () => packagesData.packages as Pkg[],
    ),
    fetchRows<Row, ComparisonRow[]>(
      `comparison_rows?select=label,values&published=eq.true&${ORDER}`,
      (rows) => rows as ComparisonRow[],
      () => packagesData.comparison as ComparisonRow[],
    ),
    fetchRows<Row, AddOn[]>(
      `addons?select=name,text,price_text&published=eq.true&${ORDER}`,
      (rows) => rows.map(({ price_text, ...r }) => ({ ...r, price: price_text }) as AddOn),
      () => packagesData.addons,
    ),
  ])
  return { packages, comparison, addons }
}

export const getFaq = (scope: string) =>
  fetchRows<Row, FaqItem[]>(
    `faq?select=scope,question,answer&scope=eq.${encodeURIComponent(scope)}&published=eq.true&${ORDER}`,
    (rows) => rows.map((r) => ({ scope: r.scope, q: r.question, a: r.answer })),
    () => (faqData as FaqItem[]).filter((f) => f.scope === scope),
  )

export const getTestimonials = () =>
  fetchRows<Row, Testimonial[]>(
    `testimonials?select=author,role,text&published=eq.true&${ORDER}`,
    (rows) => rows as Testimonial[],
    () => testimonialsData.filter((t) => !('placeholder' in t && t.placeholder)),
  )

export const getProducts = () =>
  fetchRows<Row, Product[]>(
    `products?select=slug,title,description,category,price_text,cover_url&published=eq.true&${ORDER}`,
    (rows) =>
      rows.map((r) => ({ slug: r.slug, title: r.title, description: r.description, category: r.category, price: r.price_text, cover: r.cover_url })),
    () => [],
  )

export interface Demo {
  slug: string
  title: string
  description: string
  category: string
  kind: 'url' | 'files'
  url: string
  entry: string
  cover: string
}
export const getDemos = () =>
  fetchRows<Row, Demo[]>(
    `demos?select=slug,title,description,category,kind,url,entry,cover_url&published=eq.true&${ORDER}`,
    (rows) => rows.map(({ cover_url, ...r }) => ({ ...r, cover: cover_url || '' }) as Demo),
    () => [],
  )
export async function getDemo(slug: string) {
  return (await getDemos()).find((d) => d.slug === slug) ?? null
}

export async function getPosts(): Promise<Post[]> {
  if (!HAS_BACKEND) return localPosts
  const posts = await fetchRows<Row, ApiPost[] | null>(
    'posts?select=slug,title,description,body,date&published=eq.true&order=date.desc,id.desc',
    (rows) => rows as ApiPost[],
    () => null,
  )
  return posts ? posts.map(toPost) : localPosts
}
export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug) ?? null
}

// ---------- Buyurtma yuborish (Edge Function) ----------
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
  if (!HAS_BACKEND) return { ok: false, reason: 'network' }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-order`, {
      method: 'POST',
      headers: { ...supabaseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) return { ok: true }
    if (res.status === 429) return { ok: false, reason: 'rate_limit' }
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { errors?: Record<string, string> }
      return { ok: false, reason: 'validation', fields: body.errors ?? {} }
    }
    return { ok: false, reason: 'server' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
