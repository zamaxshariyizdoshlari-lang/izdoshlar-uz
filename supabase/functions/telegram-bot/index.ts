// Telegram bot (webhook). Mijoz botga yozadi: narxlar, loyihalar, buyurtma. Buyurtma `orders` jadvaliga tushadi
// va egasiga Telegram orqali xabar boradi. Webhook sirri bot tokenidan olinadi (qoʻshimcha secret kerak emas).
// Birinchi marta ulash: brauzerda  <funksiya manzili>?setup=1  ni oching.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { type Ctx, type Session, emptySession, handle, ownerText } from './logic.ts'

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
const OWNER_CHAT = Deno.env.get('TELEGRAM_CHAT_ID') ?? ''
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://izdoshlar-uz.netlify.app').replace(/\/$/, '')
const CONTACT_TELEGRAM = Deno.env.get('CONTACT_TELEGRAM') ?? '@Abrorjon_Abdusalimov'
const CONTACT_PHONE = Deno.env.get('CONTACT_PHONE') ?? '+998 91 152 65 79'
const FN_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-bot`

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function tg(method: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false // xato matnida token boʻlishi mumkin: yozmaymiz
  }
}

const markup = (kb?: { text: string; data?: string; url?: string }[][]) =>
  kb ? { inline_keyboard: kb.map((r) => r.map((b) => (b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data }))) } : undefined

Deno.serve(async (req) => {
  if (!TOKEN) return new Response('bot sozlanmagan', { status: 503 })
  const secret = (await sha256(`izdoshlar-webhook:${TOKEN}`)).slice(0, 48)
  const url = new URL(req.url)

  if (req.method === 'GET' && url.searchParams.get('setup') === '1') {
    const ok = await tg('setWebhook', { url: FN_URL, secret_token: secret, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true })
    await tg('setMyCommands', { commands: [{ command: 'start', description: 'Menyu' }, { command: 'menu', description: 'Bosh menyu' }, { command: 'cancel', description: 'Bekor qilish' }] })
    return new Response(ok ? 'Ulandi. Botga /start yozing.' : 'Ulab boʻlmadi (token yoki tarmoq xatosi).', { status: ok ? 200 : 502 })
  }
  if (req.method !== 'POST') return new Response('ok')
  if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) return new Response('forbidden', { status: 403 })

  // deno-lint-ignore no-explicit-any
  let update: any
  try {
    update = await req.json()
  } catch {
    return new Response('ok')
  }
  const cbq = update.callback_query
  const msg = cbq?.message ?? update.message
  const chatId: number | undefined = msg?.chat?.id
  if (!chatId || msg?.chat?.type !== 'private') return new Response('ok')
  if (cbq) await tg('answerCallbackQuery', { callback_query_id: cbq.id })

  const rl = await db.rpc('hit_rate_limit', { p_key: `bot:${chatId}`, p_limit: 40, p_window_seconds: 60 })
  if (rl.data === false) return new Response('ok')

  const { data: row } = await db.from('bot_sessions').select('step,data').eq('chat_id', chatId).maybeSingle()
  const session: Session = row ? { step: row.step, data: row.data ?? {} } : emptySession()

  const [pk, dm] = await Promise.all([
    db.from('packages').select('name,tagline,price_text,features').eq('published', true).order('sort_order'),
    db.from('demos').select('slug,title,category').eq('published', true).order('sort_order'),
  ])
  const ctx: Ctx = { packages: pk.data ?? [], demos: dm.data ?? [], siteUrl: SITE_URL, contactTelegram: CONTACT_TELEGRAM, contactPhone: CONTACT_PHONE }

  const result = handle(session, { text: cbq ? undefined : msg?.text, callback: cbq?.data, username: (cbq ?? update.message)?.from?.username }, ctx)

  for (const o of result.outs) {
    await tg('sendMessage', { chat_id: chatId, text: o.text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: markup(o.keyboard) })
  }

  if (result.session.step) {
    await db.from('bot_sessions').upsert({ chat_id: chatId, step: result.session.step, data: result.session.data, updated_at: new Date().toISOString() })
  } else {
    await db.from('bot_sessions').delete().eq('chat_id', chatId)
  }

  if (result.order) {
    const lim = await db.rpc('hit_rate_limit', { p_key: `botorder:${chatId}`, p_limit: 3, p_window_seconds: 3600 })
    if (lim.data !== false) {
      const { data, error } = await db
        .from('orders')
        .insert({ kind: 'order', audience: 'business', service_type: 'other', package: 'custom', budget_range: 'unknown', source_page: '/telegram-bot', consented_at: new Date().toISOString(), ...result.order })
        .select('id')
        .single()
      if (!error && data && OWNER_CHAT) {
        const sent = await tg('sendMessage', { chat_id: OWNER_CHAT, text: ownerText(result.order), parse_mode: 'HTML', disable_web_page_preview: true })
        await db.from('orders').update(sent ? { notified_at: new Date().toISOString(), notify_error: '' } : { notify_error: 'Telegram yuborilmadi' }).eq('id', data.id)
      }
    }
  }

  // Eski tugallanmagan suhbatlarni vaqti-vaqti bilan tozalaymiz
  if (Math.random() < 0.02) await db.from('bot_sessions').delete().lt('updated_at', new Date(Date.now() - 7 * 864e5).toISOString())
  return new Response('ok')
})
