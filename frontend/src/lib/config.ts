// Bitta joyda: brend va aloqa maʼlumotlari. Qiymatlar .env orqali almashtiriladi.
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Izdoshlar'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://[DOMAIN]').replace(/\/$/, '')
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')
export const TELEGRAM_USERNAME = import.meta.env.VITE_TELEGRAM_USERNAME || ''
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || ''
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || ''
// Huquqiy rekvizitlar (maxfiylik siyosati, oferta va footerda koʻrsatiladi)
export const LEGAL_NAME = import.meta.env.VITE_LEGAL_NAME || ''
export const LEGAL_INN = import.meta.env.VITE_LEGAL_INN || ''
export const LEGAL_ADDRESS = import.meta.env.VITE_LEGAL_ADDRESS || ''
