import { ArrowLeft } from 'lucide-react'
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { CtaBand } from '../components/ui'
import { t } from '../i18n'
import { getProject, type Project } from '../lib/api'
import { Component as NotFound } from './NotFound'

const p = t.projects

export const loader = ({ params }: LoaderFunctionArgs) => getProject(params.slug ?? '')

export function Component() {
  const project = useLoaderData() as Project | null
  if (!project) return <NotFound />

  const blocks = [
    { label: p.problem, text: project.problem },
    { label: p.solution, text: project.solution },
    { label: p.result, text: project.result },
  ]

  return (
    <>
      <Seo title={project.title} description={project.summary} path={`/loyihalar/${project.slug}`} />
      <header className="border-b border-line bg-cream-100">
        <div className="container-page py-12 sm:py-16">
          <Link to="/loyihalar" className="inline-flex items-center gap-1 font-bold text-brand-700">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.common.back}
          </Link>
          <span className="badge mt-5 block w-fit">{p.categories[project.category]}</span>
          <h1 className="h1 mt-3 max-w-3xl">{project.title}</h1>
          <p className="lead mt-4 max-w-2xl">{project.summary}</p>
        </div>
      </header>

      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-3">
          {blocks.map((b, i) => (
            <article key={b.label} className="card">
              <span className={`grid h-9 w-9 place-items-center rounded-full font-extrabold ${i === 2 ? 'bg-leaf-100 text-leaf-600' : 'bg-brand-50 text-brand-700'}`}>{i + 1}</span>
              <h2 className="mt-3 text-xl">{b.label}</h2>
              <p className="mt-2 text-ink-700">{b.text}</p>
            </article>
          ))}
        </div>

        <div className="container-page mt-10">
          <h2 className="text-xl">{p.tech}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {project.tech.map((x) => (
              <li key={x} className="badge badge-leaf">{x}</li>
            ))}
          </ul>
        </div>

        <div className="container-page mt-10">
          <h2 className="text-xl">{p.screenshots}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {project.screenshots.length
              ? project.screenshots.map((src) => <img key={src} src={src} alt={project.title} loading="lazy" className="rounded-card border border-line" />)
              : [1, 2].map((n) => (
                  <div key={n} className="grid aspect-video place-items-center rounded-card border-2 border-dashed border-line bg-white text-ink-500">
                    Rasm {n}
                  </div>
                ))}
          </div>
          {project.placeholder && <p className="mt-4 text-sm text-ink-500">{p.placeholderNote}</p>}
        </div>
      </section>

      <CtaBand title={p.ctaTitle} text={p.ctaText} button={t.nav.order} />
    </>
  )
}
