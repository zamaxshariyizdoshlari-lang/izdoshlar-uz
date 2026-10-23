import { BarChart3, CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { HeroArt } from '../components/sections/HeroArt'
import { Accordion, ButtonLink, CtaBand, SectionHeading } from '../components/ui'
import { t } from '../i18n'

const s = t.schools

const icons: Record<string, LucideIcon> = {
  attendance: ClipboardCheck,
  grades: GraduationCap,
  timetable: CalendarDays,
  parents: Users,
  reports: BarChart3,
  ai: Sparkles,
}

export function Component() {
  return (
    <>
      <Seo
        title={s.seoTitle}
        description={s.seoDescription}
        path="/maktablar"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: s.faq.items.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50">
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="badge badge-leaf">{s.hero.badge}</span>
            <h1 className="h1 mt-5">{s.hero.title}</h1>
            <p className="lead mt-5">{s.hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/aloqa?tur=demo">{s.hero.cta}</ButtonLink>
              <ButtonLink to="/loyihalar" variant="secondary">{s.hero.secondary}</ButtonLink>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-ink-700">
              {s.hero.chips.map((c) => (
                <li key={c} className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-leaf-500" aria-hidden /> {c}
                </li>
              ))}
            </ul>
          </div>
          <HeroArt className="mx-auto w-full max-w-md lg:max-w-none" />
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading title={s.problems.title} />
          <div className="grid gap-6 md:grid-cols-3">
            {s.problems.items.map((p) => (
              <div key={p.title} className="card">
                <h3 className="text-lg">{p.title}</h3>
                <p className="mt-2 text-ink-700">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-cream-100">
        <div className="container-page">
          <SectionHeading title={s.features.title} subtitle={s.features.subtitle} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {s.features.items.map((f) => {
              const Icon = icons[f.icon] ?? Sparkles
              return (
                <article key={f.title} className="card card-hover">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg">{f.title}</h3>
                  <p className="mt-2 text-ink-700">{f.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading title={s.steps.title} subtitle={s.steps.subtitle} />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {s.steps.items.map((st, i) => (
              <li key={st.title} className="card">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-sun-400 text-lg font-extrabold text-ink-900">{i + 1}</span>
                <h3 className="mt-4 text-lg">{st.title}</h3>
                <p className="mt-2 text-ink-700">{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section bg-leaf-50">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-leaf-600">
              <ShieldCheck className="h-7 w-7" aria-hidden />
            </span>
            <h2 className="h2 mt-4">{s.security.title}</h2>
            <p className="lead mt-3">{s.security.text}</p>
            <Link to="/maxfiylik" className="mt-4 inline-block font-bold text-brand-700 underline">{s.security.link}</Link>
          </div>
          <ul className="space-y-3">
            {s.security.items.map((it) => (
              <li key={it} className="card flex items-start gap-3 !p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf-500" aria-hidden />
                {it}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="card mx-auto max-w-3xl text-center">
            <h2 className="text-2xl">{s.pricing.title}</h2>
            <p className="lead mt-3">{s.pricing.text}</p>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-page">
          <SectionHeading title={s.faq.title} />
          <Accordion items={s.faq.items} />
        </div>
      </section>

      <CtaBand title={s.cta.title} text={s.cta.text} button={s.cta.button} to="/aloqa?tur=demo" />
    </>
  )
}
