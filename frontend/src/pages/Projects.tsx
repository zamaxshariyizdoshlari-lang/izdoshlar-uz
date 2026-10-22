import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ProjectCard } from '../components/sections/ProjectCard'
import { PageHeader } from '../components/ui'
import { t } from '../i18n'
import { getProjects, type Project } from '../lib/api'

const p = t.projects

export const loader = () => getProjects()

export function Component() {
  const [filter, setFilter] = useState('all')
  const all = useLoaderData() as Project[]
  const shown = filter === 'all' ? all : all.filter((x) => x.category === filter)
  const tags = ['all', ...Object.keys(p.categories)]

  return (
    <>
      <Seo title={p.title} description={p.subtitle} path="/loyihalar" />
      <PageHeader title={p.title} subtitle={p.subtitle} />
      <section className="section">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtr">
            {tags.map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                aria-pressed={filter === k}
                className={`rounded-full border-2 px-5 py-2 font-bold transition ${
                  filter === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-700 hover:border-brand-400'
                }`}
              >
                {k === 'all' ? p.filterAll : p.categories[k]}
              </button>
            ))}
          </div>
          {shown.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((x) => (
                <ProjectCard key={x.slug} project={x} />
              ))}
            </div>
          ) : (
            <p className="lead">{p.empty}</p>
          )}
        </div>
      </section>
    </>
  )
}
