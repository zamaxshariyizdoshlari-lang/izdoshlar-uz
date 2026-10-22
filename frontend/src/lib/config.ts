// Bitta joyda: brend va aloqa ma'lumotlari. Qiymatlar .env orqali almashtiriladi.
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Izdoshlar'
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://[DOMAIN]').replace(/\/$/, '')
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')
export const TELEGRAM_USERNAME = import.meta.env.VITE_TELEGRAM_USERNAME || ''
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || ''
