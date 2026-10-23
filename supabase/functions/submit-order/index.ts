// Ochiq buyurtma qabul qilish. Brauzer jadvalga toʻgʻridan-toʻgʻri yoza olmaydi (RLS yopiq),
// shuning uchun barcha tekshiruv, spamdan himoya va Telegram xabari shu yerda.
// JWT talab qilinmaydi (ochiq forma): himoya = tekshiruv + honeypot + tezlik cheklovi.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { formatTelegram } from './format.ts'
import { validateOrder } from './validate.ts'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ??
  'https://izdoshlar-uz.netlify.app,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const HOURLY_LIMIT = Number(Deno.env.get('ORDER_HOURLY_LIMIT') ?? '15')
const BURST_LIMIT = Number(Deno.env.get('ORDER_BURST_LIMIT') ?? '3')
const MAX_BODY_BYTES = 20_000

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } })

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Telegramga yuboradi; natijani buyurtmaga yozadi. Xato buyurtmani buzmaydi. */
async function notify(id: string, text: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chat = Deno.env.get('TELEGRAM_CHAT_ID')
  let error = ''
  if (!token || !chat) {
    error = 'Telegram sozlanmagan'
  } else {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) error = `HTTP ${res.status}`
    } catch (e) {
      // Xato matnida token (URL ichida) boʻlishi mumkin, shuning uchun faqat tur nomi
      error = e instanceof Error ? e.name : 'Error'
    }
  }
  await db
    .from('orders')
    .update(error ? { notify_error: error } : { notified_at: new Date().toISOString(), notify_error: '' })
    .eq('id', id)
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin)

  let raw: unknown
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) return json({ errors: { non_field_errors: 'Soʻrov juda katta.' } }, 413, origin)
    raw = JSON.parse(text)
  } catch {
    return json({ errors: { non_field_errors: 'Soʻrov formati notoʻgʻri.' } }, 400, origin)
  }

  const result = validateOrder(raw)
  if (!result.ok) return json({ errors: result.errors }, 400, origin)

  // Botga muvaffaqiyat koʻrsatamiz, lekin hech narsa saqlamaymiz
  if (result.spam) return json({ ok: true }, 201, origin)

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const ipHash = await sha256(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`)

  const [hour, burst] = await Promise.all([
    db.rpc('hit_rate_limit', { p_key: `h:${ipHash}`, p_limit: HOURLY_LIMIT, p_window_seconds: 3600 }),
    db.rpc('hit_rate_limit', { p_key: `m:${ipHash}`, p_limit: BURST_LIMIT, p_window_seconds: 60 }),
  ])
  if (hour.error || burst.error) {
    console.error('rate limit xatosi', hour.error?.code, burst.error?.code)
    return json({ error: 'server' }, 500, origin)
  }
  if (hour.data === false || burst.data === false) {
    return json({ errors: { non_field_errors: "Soʻrovlar koʻp yuborildi. Keyinroq urinib koʻring." } }, 429, origin)
  }

  const { data, error } = await db
    .from('orders')
    .insert({ ...result.value, ip_hash: ipHash, consented_at: new Date().toISOString() })
    .select('id')
    .single()
  if (error || !data) {
    console.error('buyurtma saqlanmadi', error?.code)
    return json({ error: 'server' }, 500, origin)
  }

  // Javobni kutdirmaymiz: xabar fon rejimida yuboriladi
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime
  const job = notify(data.id, formatTelegram(result.value))
  if (runtime?.waitUntil) runtime.waitUntil(job)
  else await job

  return json({ ok: true, id: data.id }, 201, origin)
})
