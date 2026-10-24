// Boshqaruv: statistika, hisob (parol) va boshqa yordamchi soʻrovlar.
import { raw } from './adminApi'

export interface Metrics {
  visitors: number
  views: number
  orders: number
  demo_opens: number
}
export interface DayPoint {
  date: string
  visitors: number
  views: number
  orders: number
}
export interface NameCount {
  name: string
  visitors?: number
  count?: number
}
export interface Stats {
  days: number
  current: Metrics
  previous: Metrics
  live: number
  daily: DayPoint[]
  hourly: { hour: number; views: number }[]
  pages: { path: string; views: number; visitors: number }[]
  referrers: { name: string; visitors: number }[]
  utm: { name: string; visitors: number }[]
  devices: { name: string; visitors: number }[]
  browsers: { name: string; visitors: number }[]
  os: { name: string; visitors: number }[]
  countries: { name: string; visitors: number }[]
  events: { name: string; count: number }[]
  demos: { slug: string; opens: number }[]
  orders_by_status: { name: string; count: number }[]
  orders_by_service: { name: string; count: number }[]
}

export interface Funnel {
  visitors: number
  projects: number
  intent: number
  leads: number
}

export async function fetchFunnel(token: string, days: number): Promise<Funnel> {
  const res = await raw('/rest/v1/rpc/admin_funnel', { method: 'POST', token, body: JSON.stringify({ p_days: days }) })
  return res.json()
}

export async function fetchStats(token: string, days: number): Promise<Stats> {
  const res = await raw('/rest/v1/rpc/admin_stats', { method: 'POST', token, body: JSON.stringify({ p_days: days }) })
  return res.json()
}

/** Yangi (koʻrilmagan) buyurtmalar soni: yon menyudagi belgi uchun. */
export async function countNewOrders(token: string): Promise<number> {
  const res = await raw('/rest/v1/orders?select=id&status=eq.yangi', {
    method: 'HEAD',
    token,
    headers: { Prefer: 'count=exact' },
  })
  const total = (res.headers.get('content-range') ?? '').split('/')[1]
  return Number(total) || 0
}

export async function getAccount(token: string): Promise<{ email: string; created_at: string }> {
  const res = await raw('/auth/v1/user', { token })
  return res.json()
}

export async function changePassword(token: string, password: string): Promise<void> {
  await raw('/auth/v1/user', { method: 'PUT', token, body: JSON.stringify({ password }) })
}
