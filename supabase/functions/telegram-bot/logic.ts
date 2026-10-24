// Telegram bot mantiqi (sof funksiyalar: tarmoq va bazasiz, shuning uchun sinash oson).
export type Step = 'consent' | 'name' | 'phone' | 'desc'
export interface Session {
  step: Step | null
  data: { name?: string; phone?: string }
}
export interface Button {
  text: string
  data?: string
  url?: string
}
export interface Out {
  text: string
  keyboard?: Button[][]
}
export interface Pkg {
  name: string
  tagline: string | null
  price_text: string | null
  features: string[] | null
}
export interface Demo {
  slug: string
  title: string
  category: string
}
export interface Ctx {
  packages: Pkg[]
  demos: Demo[]
  siteUrl: string
  contactTelegram: string
  contactPhone: string
}
export interface OrderDraft {
  name: string
  phone: string
  telegram: string
  description: string
}
export interface Input {
  text?: string
  callback?: string
  username?: string
}
export interface Result {
  session: Session
  outs: Out[]
  order?: OrderDraft
}

export const emptySession = (): Session => ({ step: null, data: {} })

/** Telegram HTML uchun xavfsiz matn. */
export const esc = (v: unknown): string => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** +998901234567 koʻrinishiga keltiradi; notoʻgʻri boʻlsa null. */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (d.length === 9) return `+998${d}`
  if (d.length === 12 && d.startsWith('998')) return `+${d}`
  return null
}

const MENU: Button[][] = [
  [{ text: '📦 Narxlar', data: 'prices' }, { text: '🖥 Loyihalar', data: 'projects' }],
  [{ text: '🧠 Bepul tahlil', data: 'analysis' }, { text: '✍️ Buyurtma berish', data: 'order' }],
  [{ text: '📞 Aloqa', data: 'contact' }],
]

export const menu = (intro = true): Out => ({
  text: intro
    ? '👋 <b>Izdoshlar</b> botiga xush kelibsiz!\n\nBiz biznes uchun sayt, mobil ilova, Telegram bot va AI agent yaratamiz. Pastdan kerakli boʻlimni tanlang:'
    : 'Kerakli boʻlimni tanlang:',
  keyboard: MENU,
})

const BACK: Button[][] = [[{ text: '⬅️ Menyu', data: 'menu' }]]
const ORDER_BTN: Button[] = [{ text: '✍️ Buyurtma berish', data: 'order' }]

export function pricesOut(packages: Pkg[]): Out {
  if (!packages.length) return { text: 'Narxlar tez orada. Vazifangizni yozing, narxni kelishamiz.', keyboard: [ORDER_BTN, ...BACK] }
  const blocks = packages.map((p) => {
    const feats = (p.features ?? []).slice(0, 4).map((f) => `  • ${esc(f)}`).join('\n')
    return `<b>${esc(p.name)}</b>${p.price_text ? ` — ${esc(p.price_text)}` : ''}${p.tagline ? `\n${esc(p.tagline)}` : ''}${feats ? `\n${feats}` : ''}`
  })
  return { text: `📦 <b>Paketlar</b>\n\n${blocks.join('\n\n')}\n\nNarx loyiha hajmiga qarab oldindan kelishiladi.`, keyboard: [ORDER_BTN, ...BACK] }
}

export function projectsOut(demos: Demo[], siteUrl: string): Out {
  if (!demos.length) return { text: 'Loyihalar tez orada joylanadi.', keyboard: BACK }
  const rows: Button[][] = demos.slice(0, 8).map((d) => [{ text: `🖥 ${d.title}`.slice(0, 60), url: `${siteUrl}/demolar/${d.slug}` }])
  rows.push([{ text: '🌐 Hamma loyihalar', url: `${siteUrl}/loyihalar` }], ...BACK)
  return { text: '🖥 <b>Bizning loyihalar</b>\n\nBosing va telefon yoki kompyuterda oʻzingiz sinab koʻring:', keyboard: rows }
}

export function contactOut(c: Ctx): Out {
  return {
    text: `📞 <b>Aloqa</b>\n\nTelefon: ${esc(c.contactPhone)}\nTelegram: ${esc(c.contactTelegram)}\n\nYoki buyurtma qoldiring, biz bogʻlanamiz.`,
    keyboard: [[{ text: '✈️ Telegramda yozish', url: `https://t.me/${c.contactTelegram.replace(/^@/, '')}` }], ORDER_BTN, ...BACK],
  }
}

const CANCEL: Button[][] = [[{ text: '✖️ Bekor qilish', data: 'cancel' }]]

/** Bitta kiruvchi xabar/tugma -> yangi holat, javoblar va (tayyor boʻlsa) buyurtma. */
export function handle(session: Session, input: Input, ctx: Ctx): Result {
  const text = (input.text ?? '').trim()
  const cb = input.callback ?? ''
  const idle = emptySession()
  const out = (s: Session, ...outs: Out[]): Result => ({ session: s, outs })

  if (text === '/start' || text === '/menu' || cb === 'menu') return out(idle, menu(text === '/start'))
  if (text === '/cancel' || cb === 'cancel') return out(idle, { text: 'Bekor qilindi.', keyboard: MENU })

  if (cb === 'prices') return out(idle, pricesOut(ctx.packages))
  if (cb === 'projects') return out(idle, projectsOut(ctx.demos, ctx.siteUrl))
  if (cb === 'contact') return out(idle, contactOut(ctx))
  if (cb === 'analysis')
    return out(idle, { text: '🧠 3 ta savolga javob bering: taxminiy yechim, muddat va mos paketni olasiz.', keyboard: [[{ text: 'Tahlilni boshlash', url: `${ctx.siteUrl}/tahlil` }], ...BACK] })

  if (cb === 'order') {
    return out(
      { step: 'consent', data: {} },
      {
        text: `✍️ <b>Buyurtma</b>\n\nIsm, telefon va vazifangizni soʻraymiz. Davom etish bilan <a href="${esc(ctx.siteUrl)}/maxfiylik">maxfiylik siyosati</a> bilan tanishganingizni va shaxsiy maʼlumotlaringizni qayta ishlashga rozilik berganingizni tasdiqlaysiz.`,
        keyboard: [[{ text: '✅ Roziman, davom etish', data: 'consent_yes' }], ...CANCEL],
      },
    )
  }
  if (cb === 'consent_yes' && session.step === 'consent') return out({ step: 'name', data: {} }, { text: 'Ismingiz nima?', keyboard: CANCEL })

  if (session.step === 'name' && text) {
    if (text.startsWith('/') || text.length < 2 || text.length > 100) return out(session, { text: 'Ismingizni yozing (2 dan 100 belgigacha).', keyboard: CANCEL })
    return out({ step: 'phone', data: { name: text } }, { text: 'Telefon raqamingiz? Masalan: +998 90 123 45 67', keyboard: CANCEL })
  }
  if (session.step === 'phone' && text) {
    const phone = normalizePhone(text)
    if (!phone) return out(session, { text: 'Raqam notoʻgʻri. Masalan: +998 90 123 45 67', keyboard: CANCEL })
    return out({ step: 'desc', data: { ...session.data, phone } }, { text: 'Qanday sayt, ilova yoki bot kerak? Qisqacha yozing (kamida 10 belgi).', keyboard: CANCEL })
  }
  if (session.step === 'desc' && text) {
    if (text.length < 10) return out(session, { text: 'Biroz batafsilroq yozing (kamida 10 belgi).', keyboard: CANCEL })
    const username = input.username ? `@${input.username}`.slice(0, 33) : ''
    return {
      session: idle,
      outs: [{ text: '✅ Rahmat! Soʻrovingiz qabul qilindi. Bir ish kuni ichida bogʻlanamiz.', keyboard: MENU }],
      order: { name: session.data.name ?? '', phone: session.data.phone ?? '', telegram: username, description: text.slice(0, 2000) },
    }
  }

  if (session.step) return out(session, { text: 'Davom etish uchun yuqoridagi tugmani bosing yoki bekor qiling.', keyboard: CANCEL })
  return out(idle, menu(false))
}

/** Egasiga yuboriladigan xabar (HTML). */
export function ownerText(o: OrderDraft): string {
  const lines = ['<b>🆕 Yangi buyurtma (Telegram bot)</b>', `👤 ${esc(o.name)}`, `📞 ${esc(o.phone)}`]
  if (o.telegram) lines.push(`✈️ ${esc(o.telegram)}`)
  lines.push(`\n${esc(o.description.slice(0, 700))}`)
  return lines.join('\n')
}
