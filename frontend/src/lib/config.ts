// Bitta joyda: brend va aloqa maʼlumotlari. Qiymatlar .env orqali almashtiriladi.
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Izdoshlar'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://[DOMAIN]').replace(/\/$/, '')

// Supabase (ochiq URL va "publishable/anon" kalit: brauzerda boʻlishi moʻljallangan, himoya RLS orqali).
// Berilmasa sayt repo ichidagi zaxira kontent bilan ishlaydi, buyurtma formasi esa xato beradi.
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
export const HAS_BACKEND = Boolean(SUPABASE_URL && SUPABASE_KEY)

export const TELEGRAM_USERNAME = import.meta.env.VITE_TELEGRAM_USERNAME || ''
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || ''
// Biznes yoʻnalishi (sayt, bot, AI agent, paketlar va narxlar) standart holatda yoqilgan.
// Vaqtincha yashirish uchun VITE_ENABLE_BUSINESS=0 (sayt faqat taʼlim yoʻnalishida qoladi).
export const ENABLE_BUSINESS = import.meta.env.VITE_ENABLE_BUSINESS !== '0'
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || ''
// Huquqiy rekvizitlar (maxfiylik siyosati, oferta va footerda koʻrsatiladi)
export const LEGAL_NAME = import.meta.env.VITE_LEGAL_NAME || ''
export const LEGAL_INN = import.meta.env.VITE_LEGAL_INN || ''
export const LEGAL_ADDRESS = import.meta.env.VITE_LEGAL_ADDRESS || ''
// 1 boʻlsa sayt qidiruv tizimlariga yopiladi (sinov muhiti, namuna matnlar)
export const NOINDEX = import.meta.env.VITE_NOINDEX === '1'

/** Supabase REST/Auth/Storage soʻrovlari uchun sarlavhalar (yangi `sb_publishable_` kalit JWT emas, shuning uchun Authorization faqat JWT kalitda). */
export function supabaseHeaders(bearer?: string): Record<string, string> {
  const h: Record<string, string> = { apikey: SUPABASE_KEY }
  const auth = bearer ?? (SUPABASE_KEY.startsWith('eyJ') ? SUPABASE_KEY : '')
  if (auth) h.Authorization = `Bearer ${auth}`
  return h
}
