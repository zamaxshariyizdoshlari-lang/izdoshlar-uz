// Statistika hodisalarini tozalash va qurilmani aniqlash. Sof funksiyalar (Deno va Node testlari uchun).

export const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|python-requests|curl|wget|httpclient|axios|node-fetch|go-http|monitor|uptime/i

export interface Client {
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
}

export function parseUA(ua: string): Client {
  const device: Client['device'] = /ipad|tablet|kindle|silk/i.test(ua)
    ? 'tablet'
    : /android.*mobile|mobi|iphone|ipod|windows phone/i.test(ua)
      ? 'mobile'
      : /android/i.test(ua)
        ? 'tablet'
        : 'desktop'

  let browser = ''
  if (/YaBrowser/i.test(ua)) browser = 'Yandex'
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung'
  else if (/Edg(e|A|iOS)?\//i.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera'
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox'
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua)) browser = 'Safari'

  let os = ''
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/Linux|X11/i.test(ua)) os = 'Linux'

  return { device, browser, os }
}

/** Referrer URL dan faqat host: oʻzimizning domenlar va notoʻgʻri qiymatlar boʻsh qaytadi. */
export function referrerHost(ref: unknown, ownHosts: string[]): string {
  if (typeof ref !== 'string' || !ref) return ''
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, '')
    if (!host || ownHosts.includes(host)) return ''
    return host.slice(0, 200)
  } catch {
    return ''
  }
}

export function cleanPath(p: unknown): string {
  if (typeof p !== 'string') return ''
  let path = p.split(/[?#]/)[0].trim()
  if (!path.startsWith('/')) return ''
  path = path.replace(/\/{2,}/g, '/')
  if (path.length > 1) path = path.replace(/\/$/, '')
  // Boshqaruv sahifalari hisoblanmaydi
  if (path === '/boshqaruv' || path.startsWith('/boshqaruv/')) return ''
  return path.slice(0, 300)
}

const token = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[^\w\-.:+ ]/g, '').trim().slice(0, max) : ''

export interface CleanEvent {
  kind: 'view' | 'event'
  name: string
  path: string
  referrer: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  lang: string
  meta: Record<string, string>
}

export const MAX_EVENTS_PER_REQUEST = 10

export function sanitizeEvents(raw: unknown, ownHosts: string[]): CleanEvent[] {
  const list = (raw && typeof raw === 'object' && Array.isArray((raw as { events?: unknown }).events)
    ? (raw as { events: unknown[] }).events
    : []
  ).slice(0, MAX_EVENTS_PER_REQUEST)

  const out: CleanEvent[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    const kind = e.k === 'view' || e.k === 'event' ? e.k : null
    const path = cleanPath(e.p)
    if (!kind || !path) continue
    const name = kind === 'event' ? (typeof e.n === 'string' && /^[a-z_]{2,40}$/.test(e.n) ? e.n : '') : ''
    if (kind === 'event' && !name) continue

    const meta: Record<string, string> = {}
    const m = e.m && typeof e.m === 'object' ? (e.m as Record<string, unknown>) : {}
    if (typeof m.slug === 'string' && /^[a-z0-9-]{1,80}$/.test(m.slug)) meta.slug = m.slug
    if (typeof m.kind === 'string' && /^[a-z_]{1,20}$/.test(m.kind)) meta.kind = m.kind
    if (typeof m.service === 'string' && /^[a-z_]{1,20}$/.test(m.service)) meta.service = m.service

    out.push({
      kind,
      name,
      path,
      referrer: kind === 'view' ? referrerHost(e.r, ownHosts) : '',
      utm_source: kind === 'view' ? token(e.us, 100) : '',
      utm_medium: kind === 'view' ? token(e.um, 100) : '',
      utm_campaign: kind === 'view' ? token(e.uc, 100) : '',
      lang: typeof e.l === 'string' && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(e.l) ? e.l : '',
      meta,
    })
  }
  return out
}
