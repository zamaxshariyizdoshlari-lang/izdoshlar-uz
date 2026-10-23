// Buyurtma maʼlumotlarini tekshirish. Sof funksiyalar (tarmoq/baza yoʻq), shuning uchun
// Deno'da ham, Node testlarida ham ishlaydi.

export const KINDS = ['order', 'demo'] as const
export const AUDIENCES = ['school', 'business'] as const
export const SERVICE_TYPES = ['website', 'erp', 'timetable', 'bot', 'ai', 'content', 'other'] as const
export const PACKAGES = ['start', 'pro', 'maktab_biznes', 'custom'] as const
export const BUDGETS = ['unknown', 'low', 'mid', 'high', 'talk'] as const

const PHONE_RE = /^\+998\d{9}$/
const TG_RE = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/

export interface CleanOrder {
  kind: (typeof KINDS)[number]
  name: string
  phone: string
  telegram: string
  audience: (typeof AUDIENCES)[number]
  service_type: (typeof SERVICE_TYPES)[number]
  package: (typeof PACKAGES)[number]
  budget_range: (typeof BUDGETS)[number]
  description: string
  file_url: string
  school_name: string
  student_count: number | null
  current_system: string
  source_page: string
}

export type Validation =
  | { ok: true; value: CleanOrder; spam: boolean }
  | { ok: false; errors: Record<string, string> }

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback

/**
 * @param minFillMs forma ochilganidan yuborilgunicha minimal vaqt (bot himoyasi)
 */
export function validateOrder(raw: unknown, now = Date.now(), minFillMs = 3000): Validation {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: { non_field_errors: "Soʻrov formati notoʻgʻri." } }
  }
  const d = raw as Record<string, unknown>
  const errors: Record<string, string> = {}

  const kind = oneOf(d.kind, KINDS, 'order')
  const name = str(d.name, 100)
  const phone = typeof d.phone === 'string' ? d.phone.replace(/[\s\-()]/g, '').slice(0, 20) : ''
  const telegram = str(d.telegram, 33)
  const description = str(d.description, 3000)
  const fileUrl = str(d.file_url, 500)
  const schoolName = str(d.school_name, 150)

  if (name.length < 2) errors.name = 'Ismingizni kiriting.'
  if (phone && !PHONE_RE.test(phone)) errors.phone = 'Telefon raqami +998901234567 koʻrinishida boʻlishi kerak.'
  if (telegram && !TG_RE.test(telegram)) errors.telegram = 'Telegram username notoʻgʻri (masalan, @username).'
  if (fileUrl && !/^https?:\/\//i.test(fileUrl)) errors.file_url = 'Havola http(s):// bilan boshlanishi kerak.'
  if (d.consent !== true) errors.consent = 'Davom etish uchun maxfiylik siyosatiga rozilik bering.'

  let studentCount: number | null = null
  if (d.student_count !== null && d.student_count !== undefined && d.student_count !== '') {
    const n = Number(d.student_count)
    if (Number.isInteger(n) && n >= 1 && n <= 100000) studentCount = n
    else errors.student_count = 'Oʻquvchilar soni notoʻgʻri.'
  }

  if (!phone && !telegram && !errors.phone && !errors.telegram) {
    errors.non_field_errors = 'Telefon yoki Telegramʼdan kamida bittasini kiriting.'
  }
  if (kind === 'demo') {
    if (!schoolName) errors.school_name = 'Maktab nomini kiriting.'
  } else if (description.length < 10) {
    errors.description = 'Iltimos, loyihani qisqacha tavsiflang.'
  }

  if (Object.keys(errors).length) return { ok: false, errors }

  // Spam belgilari: yashirin maydon toʻldirilgan yoki forma juda tez yuborilgan
  const honeypot = str(d.website, 200) !== ''
  const opened = typeof d.opened_at === 'number' ? d.opened_at : null
  const tooFast = opened !== null && now - opened < minFillMs

  return {
    ok: true,
    spam: honeypot || tooFast,
    value: {
      kind,
      name,
      phone,
      telegram,
      audience: oneOf(d.audience, AUDIENCES, kind === 'demo' ? 'school' : 'business'),
      service_type: oneOf(d.service_type, SERVICE_TYPES, 'other'),
      package: oneOf(d.package, PACKAGES, 'custom'),
      budget_range: oneOf(d.budget_range, BUDGETS, 'unknown'),
      description,
      file_url: fileUrl,
      school_name: schoolName,
      student_count: studentCount,
      current_system: str(d.current_system, 150),
      source_page: str(d.source_page, 200),
    },
  }
}
