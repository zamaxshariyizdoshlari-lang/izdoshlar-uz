import { ArrowRight, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ProjectCard } from '../components/sections/ProjectCard'
import { ButtonLink, PageHeader } from '../components/ui'
import { t } from '../i18n'
import { getDemos, getProjects, type Demo, type Project } from '../lib/api'
import { DEMO_CATEGORIES } from '../lib/demoCategories'

const p = t.projects

export async function loader() {
  const [projects, demos] = await Promise.all([getProjects(), getDemos()])
  return { projects, demos }
}

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <Link to={`/demolar/${demo.slug}`} className="card card-hover group flex flex-col !p-0 overflow-hidden">
      {demo.cover ? (
        <img src={demo.cover} alt="" loading="lazy" className="aspect-video w-full object-cover" />
      ) : (
        <div className="grid aspect-video place-items-center bg-gradient-to-br from-brand-100 to-sun-100">
          <Monitor className="h-10 w-10 text-brand-600/40" aria-hidden />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="badge self-start">{DEMO_CATEGORIES[demo.category] ?? demo.category}</span>
        <h3 className="mt-3 text-xl">{demo.title}</h3>
        {demo.description && <p className="mt-2 line-clamp-3 flex-1 text-ink-700">{demo.description}</p>}
        <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-700">
          Sinab koʻrish
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

export function Component() {
  const built = useLoaderData() as { projects: Project[]; demos: Demo[] }
  const [demos, setDemos] = useState(built.demos)
  const [filter, setFilter] = useState('all')
  // Build'dan keyin qoʻshilgan loyihalar ham koʻrinsin: brauzerda yangilab olamiz
  useEffect(() => {
    getDemos().then(setDemos)
  }, [])

  const items = [
    ...demos.map((d) => ({ key: `d-${d.slug}`, category: d.category, node: <DemoCard demo={d} /> })),
    ...built.projects.map((x) => ({ key: `p-${x.slug}`, category: x.category, node: <ProjectCard project={x} /> })),
  ]
  const label = (k: string) => DEMO_CATEGORIES[k] ?? p.categories[k] ?? k
  const tags = ['all', ...Array.from(new Set(items.map((i) => i.category)))]
  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter)

  return (
    <>
      <Seo title={p.title} description={p.subtitle} path="/loyihalar" />
      <PageHeader title={p.title} subtitle={p.subtitle} />
      <section className="section">
        <div className="container-page">
          {items.length > 1 && (
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
                  {k === 'all' ? p.filterAll : label(k)}
                </button>
              ))}
            </div>
          )}
          {shown.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((i) => (
                <div key={i.key} className="contents">{i.node}</div>
              ))}
            </div>
          ) : (
            <div className="card mx-auto max-w-2xl text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun-100 text-brand-600"><Monitor className="h-8 w-8" aria-hidden /></span>
              <h2 className="mt-4 text-2xl">{p.soonTitle}</h2>
              <p className="lead mt-3">{p.soonText}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink to="/tahlil">Bepul tahlil</ButtonLink>
                <ButtonLink to="/aloqa" variant="secondary">Buyurtma berish</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
