// Anonim statistika qabul qilish. Cookie yoʻq, IP saqlanmaydi: "sid" = kun + IP + brauzer + sir kalitdan
// olingan qaytarib boʻlmaydigan xesh (har kuni yangi, shuning uchun odamni kunlar boʻylab kuzatib boʻlmaydi).
// JWT talab qilinmaydi (ochiq sayt), himoya = origin tekshiruvi + botlarni tashlab yuborish + tezlik cheklovi.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { BOT_RE, parseUA, sanitizeEvents } from './logic.ts'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ??
  'https://izdoshlar-uz.netlify.app,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const OWN_HOSTS = ALLOWED_ORIGINS.map((o) => {
  try {
    return new URL(o).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}).filter(Boolean)

const RATE_PER_MINUTE = Number(Deno.env.get('TRACK_RATE_PER_MINUTE') ?? '240')
const MAX_BODY_BYTES = 8_000
const RETENTION_DAYS = 180

const SECRET = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = createClient(Deno.env.get('SUPABASE_URL')!, SECRET, { auth: { persistSession: false } })

const cors = (origin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
})
const done = (origin: string | null, status = 204) => new Response(null, { status, headers: cors(origin) })

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return done(origin)
  if (req.method !== 'POST') return done(origin, 405)

  // Faqat oʻz saytimizdan; begona originlar jim tashlanadi
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return done(origin)

  const ua = req.headers.get('user-agent') ?? ''
  if (!ua || BOT_RE.test(ua)) return done(origin)

  let body: unknown
  try {
    const text = await req.text() // sendBeacon text/plain yuboradi
    if (text.length > MAX_BODY_BYTES) return done(origin, 413)
    body = JSON.parse(text)
  } catch {
    return done(origin, 400)
  }

  const events = sanitizeEvents(body, OWN_HOSTS)
  if (!events.length) return done(origin)

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const day = new Date().toISOString().slice(0, 10)
  const [sid, ipKey] = await Promise.all([sha256(`${day}|${ip}|${ua}|${SECRET}`), sha256(`ip|${ip}|${SECRET}`)])

  const ok = await db.rpc('hit_rate_limit', { p_key: `t:${ipKey}`, p_limit: RATE_PER_MINUTE, p_window_seconds: 60 })
  if (ok.error || ok.data === false) return done(origin, ok.error ? 500 : 429)

  const client = parseUA(ua)
  const country = (req.headers.get('cf-ipcountry') ?? '').toUpperCase()
  const rows = events.map((e) => ({
    sid: sid.slice(0, 20),
    kind: e.kind,
    name: e.name,
    path: e.path,
    referrer: e.referrer,
    utm_source: e.utm_source,
    utm_medium: e.utm_medium,
    utm_campaign: e.utm_campaign,
    device: client.device,
    browser: client.browser,
    os: client.os,
    country: /^[A-Z]{2}$/.test(country) ? country : '',
    lang: e.lang,
    meta: e.meta,
  }))

  const { error } = await db.from('analytics_events').insert(rows)
  if (error) {
    console.error('statistika saqlanmadi', error.code)
    return done(origin, 500)
  }

  // Eski yozuvlarni vaqti-vaqti bilan tozalash (saqlash muddati)
  if (Math.random() < 0.005) {
    await db.from('analytics_events').delete().lt('created_at', new Date(Date.now() - RETENTION_DAYS * 864e5).toISOString())
  }
  return done(origin)
})
