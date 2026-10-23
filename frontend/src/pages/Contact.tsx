import { Seo } from '../components/layout/Seo'
import { ContactForm } from '../components/sections/ContactForm'
import { QuickContact, hasQuickContact } from '../components/sections/QuickContact'
import { PageHeader } from '../components/ui'
import { t } from '../i18n'

export function Component() {
  return (
    <>
      <Seo title={t.contact.title} description={t.contact.subtitle} path="/aloqa" />
      <PageHeader title={t.contact.title} subtitle={t.contact.subtitle} />
      <section className="section">
        <div className="container-page max-w-2xl">
          {hasQuickContact && (
            <div className="mb-6 text-center">
              <p className="mb-3 font-semibold text-ink-700">{t.quick.orWrite}</p>
              <QuickContact className="justify-center" />
            </div>
          )}
          <ContactForm />
        </div>
      </section>
    </>
  )
}
