// Bitta joyda: brend va aloqa maʼlumotlari. Qiymatlar .env orqali almashtiriladi.
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Izdoshlar'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://[DOMAIN]').replace(/\/$/, '')
// Ishlab chiqarishda manzil berilmasa API ishlatilmaydi (zaxira kontent), localhost faqat dev rejimda
export const API_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '')
).replace(/\/$/, '')
// 1 boʻlsa sayt qidiruv tizimlariga yopiladi (sinov muhiti, namuna matnlar)
export const NOINDEX = import.meta.env.VITE_NOINDEX === '1'
export const TELEGRAM_USERNAME = import.meta.env.VITE_TELEGRAM_USERNAME || ''
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || ''
// Biznes yoʻnalishi (sayt, bot, AI agent, paketlar va narxlar). Hozircha oʻchiq; yoqish uchun VITE_ENABLE_BUSINESS=1
export const ENABLE_BUSINESS = import.meta.env.VITE_ENABLE_BUSINESS === '1'
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || ''
// Huquqiy rekvizitlar (maxfiylik siyosati, oferta va footerda koʻrsatiladi)
export const LEGAL_NAME = import.meta.env.VITE_LEGAL_NAME || ''
export const LEGAL_INN = import.meta.env.VITE_LEGAL_INN || ''
export const LEGAL_ADDRESS = import.meta.env.VITE_LEGAL_ADDRESS || ''
