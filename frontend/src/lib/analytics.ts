// Anonim statistika: cookie yoʻq, brauzerda hech narsa saqlanmaydi. Server tomonda (track funksiyasi)
// IP + brauzerdan kunlik qaytarib boʻlmaydigan xesh olinadi. Admin oʻz saytini koʻrganda hisoblanmaydi.
import { HAS_BACKEND, SUPABASE_URL } from './config'

const ENDPOINT = `${SUPABASE_URL}/functions/v1/track`
const ADMIN_KEY = 'izdoshlar_admin_session'

let landed = false
let lastPath = ''

function disabled(): boolean {
  if (!HAS_BACKEND || typeof window === 'undefined') return true
  if (navigator.doNotTrack === '1') return true // "Kuzatma" sozlamasini hurmat qilamiz
  try {
    if (localStorage.getItem(ADMIN_KEY) || sessionStorage.getItem(ADMIN_KEY)) return true
  } catch {
    /* saqlash yopiq boʻlsa, davom etamiz */
  }
  return false
}

function send(event: Record<string, unknown>) {
  try {
    // text/plain: CORS "preflight" talab qilmaydi; credentials yoʻq
    void fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ events: [event] }),
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {})
  } catch {
    /* statistika hech qachon saytni buzmasligi kerak */
  }
}

export function trackView(path: string) {
  if (disabled() || path === lastPath) return
  lastPath = path
  const event: Record<string, unknown> = { k: 'view', p: path, l: (navigator.language || '').slice(0, 5) }
  if (!landed) {
    // Faqat kirish sahifasida: qayerdan kelgani va reklama belgilari
    landed = true
    event.r = document.referrer
    const q = new URLSearchParams(location.search)
    event.us = q.get('utm_source') ?? ''
    event.um = q.get('utm_medium') ?? ''
    event.uc = q.get('utm_campaign') ?? ''
  }
  send(event)
}

export function trackEvent(name: string, meta?: { slug?: string; kind?: string; service?: string }) {
  if (disabled()) return
  send({ k: 'event', n: name, p: location.pathname, m: meta ?? {} })
}
