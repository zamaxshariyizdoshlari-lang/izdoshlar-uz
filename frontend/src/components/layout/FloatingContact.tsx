import { Phone, Send } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { t } from '../../i18n'
import { CONTACT_PHONE } from '../../lib/config'
import { hasQuickContact, telegramHandle } from '../sections/QuickContact'

// Formali va boshqaruv sahifalarida chiqmaydi (tugma formaning ustini yopmasligi uchun)
const HIDDEN_ON = ['/aloqa', '/boshqaruv']

/** Pastki oʻng burchakdagi suzuvchi Telegram/telefon tugmalari. */
export function FloatingContact() {
  const { pathname } = useLocation()
  if (!hasQuickContact || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null

  const base =
    'grid h-14 w-14 place-items-center rounded-full shadow-lift transition duration-200 hover:-translate-y-0.5 focus-visible:outline-offset-4'
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      {CONTACT_PHONE && (
        <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className={`${base} bg-white text-brand-700 border-2 border-brand-200 sm:hidden`} aria-label={t.quick.call}>
          <Phone className="h-6 w-6" aria-hidden />
        </a>
      )}
      {telegramHandle && (
        <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer" className={`${base} bg-brand-600 text-white hover:bg-brand-700`} aria-label={t.quick.telegram}>
          <Send className="h-6 w-6" aria-hidden />
        </a>
      )}
    </div>
  )
}
