import { Seo } from '../components/layout/Seo'
import { ContactForm } from '../components/sections/ContactForm'
import { PageHeader } from '../components/ui'
import { t } from '../i18n'
import { CONTACT_PHONE, TELEGRAM_USERNAME } from '../lib/config'

export function Component() {
  const tg = TELEGRAM_USERNAME.replace('@', '')
  return (
    <>
      <Seo title={t.contact.title} description={t.contact.subtitle} path="/aloqa" />
      <PageHeader title={t.contact.title} subtitle={t.contact.subtitle} />
      <section className="section">
        <div className="container-page max-w-2xl">
          <ContactForm />
          {(tg || CONTACT_PHONE) && (
            <p className="mt-6 text-center text-ink-700">
              {t.contact.direct}:{' '}
              {tg && (
                <a className="font-bold text-brand-700 underline" href={`https://t.me/${tg}`} rel="noopener noreferrer">
                  @{tg}
                </a>
              )}
              {tg && CONTACT_PHONE && ' · '}
              {CONTACT_PHONE && (
                <a className="font-bold text-brand-700 underline" href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>
                  {CONTACT_PHONE}
                </a>
              )}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
