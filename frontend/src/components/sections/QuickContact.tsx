import { Phone, Send } from 'lucide-react'
import { t } from '../../i18n'
import { trackEvent } from '../../lib/analytics'
import { CONTACT_PHONE, TELEGRAM_USERNAME } from '../../lib/config'

export const telegramHandle = TELEGRAM_USERNAME.replace('@', '')
export const hasQuickContact = Boolean(telegramHandle || CONTACT_PHONE)

/** Telegram va telefon tugmalari. Sozlanmagan boʻlsa (env boʻsh) hech narsa chiqarmaydi. */
export function QuickContact({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  if (!hasQuickContact) return null
  const pad = size === 'sm' ? '!min-h-10 !px-4 !py-2' : ''
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {telegramHandle && (
        <a className={`btn btn-secondary ${pad}`} href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('telegram_click')}>
          <Send className="h-4 w-4" aria-hidden /> {t.quick.telegram}
        </a>
      )}
      {CONTACT_PHONE && (
        <a className={`btn btn-secondary ${pad}`} href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} onClick={() => trackEvent('phone_click')}>
          <Phone className="h-4 w-4" aria-hidden /> {CONTACT_PHONE}
        </a>
      )}
    </div>
  )
}
