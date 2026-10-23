import { Seo } from '../layout/Seo'
import { PageHeader } from '../ui'
import type { LegalDoc } from '../../i18n/legal.uz'
import { t } from '../../i18n'
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_PHONE, LEGAL_ADDRESS, LEGAL_INN, LEGAL_NAME, SITE_URL, TELEGRAM_USERNAME } from '../../lib/config'

const values: Record<string, string> = {
  brand: BRAND_NAME,
  legalName: LEGAL_NAME || '[YURIDIK NOM / YaTT]',
  inn: LEGAL_INN || '[STIR]',
  address: LEGAL_ADDRESS || '[MANZIL]',
  email: CONTACT_EMAIL || '[EMAIL]',
  phone: CONTACT_PHONE || '[TELEFON]',
  telegram: TELEGRAM_USERNAME ? `@${TELEGRAM_USERNAME.replace('@', '')}` : '[TELEGRAM]',
  site: SITE_URL.replace(/^https?:\/\//, ''),
}

const fill = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m)

export function LegalPage({ doc, path }: { doc: LegalDoc; path: string }) {
  return (
    <>
      <Seo title={doc.title} description={doc.description} path={path} />
      <PageHeader title={doc.title} subtitle={`${t.legal.updated}: ${doc.updated}`} />
      <article className="section">
        <div className="container-page max-w-3xl space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl">{s.h}</h2>
              {s.p.map((para) => (
                <p key={para} className="mt-3 text-ink-700">
                  {fill(para)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </>
  )
}
