import { Seo } from '../components/layout/Seo'
import { CtaBand, PageHeader } from '../components/ui'
import { t } from '../i18n'

const a = t.about

export function Component() {
  return (
    <>
      <Seo title={a.title} description={a.p1} path="/haqimda" />
      <PageHeader title={a.title} />
      <section className="section">
        <div className="container-page max-w-3xl">
          <p className="lead">{a.p1}</p>
          <p className="lead mt-4">{a.p2}</p>
          <p className="mt-3 text-sm text-ink-500">{a.note}</p>
        </div>
        <div className="container-page mt-10">
          <h2 className="mb-6 text-2xl">{a.valuesTitle}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {a.values.map((v) => (
              <div key={v.title} className="card">
                <h3 className="text-lg">{v.title}</h3>
                <p className="mt-2 text-ink-700">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title={t.home.cta.title} text={t.home.cta.text} button={t.home.cta.button} />
    </>
  )
}
