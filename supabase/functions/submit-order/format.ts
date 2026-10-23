import type { CleanOrder } from './validate.ts'

const SERVICE_LABELS: Record<string, string> = {
  website: 'Sayt / veb-ilova',
  erp: 'Maktab ERP',
  timetable: 'Dars jadvali',
  bot: 'Telegram / Instagram bot',
  ai: 'AI agent / yordamchi',
  content: 'Taqdimot / kontent',
  other: 'Boshqa',
}
const PACKAGE_LABELS: Record<string, string> = {
  start: 'Start',
  pro: 'Pro',
  maktab_biznes: 'Maktab-Biznes',
  custom: 'Maxsus / bilmayman',
}
const BUDGET_LABELS: Record<string, string> = {
  unknown: 'Aniq emas',
  low: 'Kam',
  mid: 'Oʻrta',
  high: 'Yuqori',
  talk: 'Kelishamiz',
}

/** Telegram HTML parse_mode uchun xavfsiz matn. */
export const esc = (v: unknown): string =>
  String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export function formatTelegram(o: CleanOrder): string {
  const lines = [`<b>${o.kind === 'demo' ? '🆕 Demo soʻrovi' : '🆕 Yangi buyurtma'}</b>`, `👤 ${esc(o.name)}`]
  if (o.phone) lines.push(`📞 ${esc(o.phone)}`)
  if (o.telegram) lines.push(`✈️ ${esc(o.telegram)}`)
  lines.push(`🛠 ${esc(SERVICE_LABELS[o.service_type])} · ${esc(PACKAGE_LABELS[o.package])}`)
  lines.push(`💰 Byudjet: ${esc(BUDGET_LABELS[o.budget_range])}`)
  if (o.school_name) lines.push(`🏫 ${esc(o.school_name)}, oʻquvchilar: ${o.student_count ?? '—'}`)
  if (o.current_system) lines.push(`🖥 Hozirgi tizim: ${esc(o.current_system)}`)
  if (o.description) lines.push(`\n${esc(o.description.slice(0, 700))}`)
  if (o.file_url) lines.push(`🔗 ${esc(o.file_url)}`)
  return lines.join('\n')
}
