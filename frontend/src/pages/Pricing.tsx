import { Check, Minus } from 'lucide-react'
import { useLoaderData } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { Accordion, ButtonLink, PageHeader, SectionHeading } from '../components/ui'
import { t } from '../i18n'
import { getFaq, getPricing, type FaqItem, type PricingData } from '../lib/api'

const p = t.pricing

export async function loader() {
  const [pricing, faq] = await Promise.all([getPricing(), getFaq('pricing')])
  return { ...pricing, faq }
}

export function Component() {
  const { packages, comparison, addons, faq } = useLoaderData() as PricingData & { faq: FaqItem[] }
  return (
    <>
      <Seo title={p.title} description={p.subtitle} path="/narxlar" />
      <PageHeader title={p.title} subtitle={p.subtitle} />

      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-3">
          {packages.map((pk) => (
            <article key={pk.key} className={`card relative flex flex-col ${pk.popular ? 'border-2 border-brand-500 shadow-lift' : ''}`}>
              {pk.popular && <span className="badge absolute -top-3 left-6 !bg-sun-400 !text-ink-900">{p.popular}</span>}
              <h2 className="text-2xl">{pk.name}</h2>
              <p className="text-ink-500">{pk.tagline}</p>
              <p className="mt-4 text-3xl font-extrabold text-brand-700">
                {pk.price} <span className="text-base font-semibold text-ink-500">{t.common.currency}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {pk.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-leaf-500" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <ButtonLink to={`/aloqa?paket=${pk.key}`} variant={pk.popular ? 'primary' : 'secondary'} className="mt-6">
                {p.choose}
              </ButtonLink>
            </article>
          ))}
        </div>
        <p className="container-page mt-6 text-center text-ink-500">{p.payNote}</p>
      </section>

      <section className="section bg-cream-100">
        <div className="container-page">
          <SectionHeading title={p.compare} />
          <div className="overflow-x-auto rounded-card border border-line bg-white shadow-soft">
            <table className="w-full min-w-[560px] text-left">
              <caption className="sr-only">{p.compare}</caption>
              <thead>
                <tr className="border-b border-line bg-brand-50">
                  <th scope="col" className="p-4">{p.feature}</th>
                  {packages.map((pk) => (
                    <th scope="col" key={pk.key} className="p-4 text-center">{pk.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <th scope="row" className="p-4 font-semibold">{row.label}</th>
                    {row.values.map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {v === true ? (
                          <Check className="mx-auto h-5 w-5 text-leaf-500" aria-label="Bor" />
                        ) : v === false ? (
                          <Minus className="mx-auto h-5 w-5 text-ink-500/50" aria-label="Yoʻq" />
                        ) : (
                          <span className="font-semibold">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading title={p.addons} subtitle={p.addonsSubtitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((a) => (
              <div key={a.name} className="card">
                <h3 className="text-lg">{a.name}</h3>
                <p className="mt-1 text-ink-700">{a.text}</p>
                <p className="mt-3 font-extrabold text-brand-700">{a.price} {t.common.currency}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-page">
          <SectionHeading title={p.faq} />
          <Accordion items={faq} />
        </div>
      </section>
    </>
  )
}
