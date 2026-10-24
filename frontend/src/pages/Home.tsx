import { ArrowRight, Briefcase, GraduationCap, School } from 'lucide-react'
import { Link, useLoaderData } from 'react-router-dom'
import { Accordion, ButtonLink, CtaBand, SectionHeading } from '../components/ui'
import { Seo } from '../components/layout/Seo'
import { HeroArt } from '../components/sections/HeroArt'
import { ProjectCard } from '../components/sections/ProjectCard'
import { t } from '../i18n'
import { getFaq, getFeaturedProjects, getTestimonials, type FaqItem, type Project, type Testimonial } from '../lib/api'
import { BRAND_NAME, ENABLE_BUSINESS, SITE_URL } from '../lib/config'

const audienceIcons = { school: School, business: Briefcase, teacher: GraduationCap }
const h = t.home
const hero = ENABLE_BUSINESS ? h.hero : h.heroSchools
const audiences = h.audiences.items.filter((a) => ENABLE_BUSINESS || a.key !== 'business')

export async function loader() {
  const [featured, testimonials, faq] = await Promise.all([getFeaturedProjects(), getTestimonials(), getFaq('home')])
  return { featured, testimonials, faq }
}

export function Component() {
  const { featured, testimonials, faq } = useLoaderData() as { featured: Project[]; testimonials: Testimonial[]; faq: FaqItem[] }
  return (
    <>
      <Seo
        path="/"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Organization', name: BRAND_NAME, url: SITE_URL }}
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sun-400/30 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-leaf-100/70 blur-2xl" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <span className="badge badge-leaf">{hero.badge}</span>
            <h1 className="h1 mt-5">{hero.title}</h1>
            <p className="lead mt-5 max-w-2xl">{hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={ENABLE_BUSINESS ? '/aloqa' : '/aloqa?tur=demo'}>{hero.ctaPrimary}</ButtonLink>
              <ButtonLink to={ENABLE_BUSINESS ? '/loyihalar' : '/maktablar'} variant="secondary">{hero.ctaSecondary}</ButtonLink>
            </div>
          </div>
          <HeroArt className="mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none" />
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading title={h.audiences.title} subtitle={h.audiences.subtitle} />
          <div className={`grid gap-6 ${ENABLE_BUSINESS ? 'md:grid-cols-3' : 'mx-auto max-w-4xl md:grid-cols-2'}`}>
            {audiences.map((a) => {
              const Icon = audienceIcons[a.key as keyof typeof audienceIcons]
              return (
                <Link key={a.key} to={a.to} className="card card-hover group flex flex-col">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="h-7 w-7" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-xl">{a.title}</h3>
                  <p className="mt-2 flex-1 text-ink-700">{a.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-700">
                    {a.cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2rem] bg-leaf-50 px-6 py-10 text-center sm:px-12">
            <h2 className="h2 mx-auto max-w-2xl">{h.diagnosis.title}</h2>
            <p className="lead mx-auto mt-3 max-w-xl">{h.diagnosis.text}</p>
            <ButtonLink to="/tahlil" className="mt-6">{h.diagnosis.button}</ButtonLink>
          </div>
        </div>
      </section>

      <section className="section bg-cream-100">
        <div className="container-page">
          <SectionHeading title={h.featured.title} subtitle={h.featured.subtitle} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink to="/loyihalar" variant="secondary">{t.common.allProjects}</ButtonLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading title={h.process.title} subtitle={h.process.subtitle} />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {h.process.steps.map((s, i) => (
              <li key={s.title} className="card relative">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-sun-400 text-lg font-extrabold text-ink-900">{i + 1}</span>
                <h3 className="mt-4 text-lg">{s.title}</h3>
                <p className="mt-2 text-ink-700">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section bg-leaf-50">
          <div className="container-page">
            <SectionHeading title={h.testimonials.title} subtitle={h.testimonials.subtitle} />
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((x, i) => (
                <figure key={i} className="card">
                  <blockquote className="text-ink-700">“{x.text}”</blockquote>
                  <figcaption className="mt-4">
                    <span className="font-bold">{x.author}</span>
                    <span className="block text-sm text-ink-500">{x.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

      )}

      <section className="section">
        <div className="container-page">
          <SectionHeading title={h.faq.title} />
          <Accordion items={faq} />
        </div>
      </section>

      <CtaBand title={h.cta.title} text={h.cta.text} button={h.cta.button} />
    </>
  )
}
