import { Monitor } from 'lucide-react'
import { Link, useLoaderData } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ButtonLink, PageHeader } from '../components/ui'
import { getDemos, type Demo } from '../lib/api'

export const loader = () => getDemos()

export const DEMO_CATEGORIES: Record<string, string> = { sayt: 'Sayt', bot: 'Bot', erp: 'ERP / tizim', kontent: 'Kontent', boshqa: 'Boshqa' }

export function Component() {
  const demos = useLoaderData() as Demo[]
  return (
    <>
      <Seo title="Demo saytlar" description="Tayyor saytlarimizni sinab koʻring: telefon, planshet va kompyuterda qanday koʻrinishini oʻzingiz koʻring." path="/demolar" />
      <PageHeader title="Demo saytlar" subtitle="Tayyor ishlarimizni sinab koʻring. Telefon, planshet va kompyuterda qanday koʻrinishini oʻzingiz tanlang." />
      <section className="section">
        <div className="container-page">
          {demos.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {demos.map((d) => (
                <Link key={d.slug} to={`/demolar/${d.slug}`} className="card card-hover flex flex-col !p-0 overflow-hidden">
                  {d.cover ? (
                    <img src={d.cover} alt="" loading="lazy" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="grid h-44 place-items-center bg-gradient-to-br from-brand-100 to-sun-100"><Monitor className="h-10 w-10 text-brand-600/40" aria-hidden /></div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="badge self-start">{DEMO_CATEGORIES[d.category] ?? d.category}</span>
                    <h2 className="mt-3 text-xl">{d.title}</h2>
                    {d.description && <p className="mt-2 line-clamp-3 flex-1 text-ink-700">{d.description}</p>}
                    <span className="mt-4 font-bold text-brand-700">Sinab ko‘rish →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card mx-auto max-w-2xl text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun-100 text-brand-600"><Monitor className="h-8 w-8" aria-hidden /></span>
              <h2 className="mt-4 text-2xl">Demolar tez orada</h2>
              <p className="lead mt-3">Tayyor saytlarimiz ustida ishlayapmiz. Oʻzingizga mos yechimni topish uchun bepul tahlildan oʻting.</p>
              <ButtonLink to="/tahlil" className="mt-6">Bepul tahlil</ButtonLink>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
