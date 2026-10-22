import { ShoppingBag } from 'lucide-react'
import { Seo } from '../components/layout/Seo'
import { ButtonLink, PageHeader } from '../components/ui'
import { t } from '../i18n'

const p = t.products

export function Component() {
  return (
    <>
      <Seo title={p.title} description={p.subtitle} path="/mahsulotlar" />
      <PageHeader title={p.title} subtitle={p.subtitle} />
      <section className="section">
        <div className="container-page">
          <div className="card mx-auto max-w-2xl text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun-100 text-brand-600">
              <ShoppingBag className="h-8 w-8" aria-hidden />
            </span>
            <h2 className="mt-4 text-2xl">{p.soonTitle}</h2>
            <p className="lead mt-3">{p.soonText}</p>
            <ButtonLink to="/aloqa?xizmat=content" className="mt-6">{p.cta}</ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
