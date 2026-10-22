import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import type { Project } from '../../lib/api'

const gradients: Record<string, string> = {
  sayt: 'from-sun-100 to-brand-100',
  erp: 'from-leaf-50 to-leaf-100',
  'ai-bot': 'from-brand-100 to-sun-100',
  kontent: 'from-leaf-100 to-sun-100',
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/loyihalar/${project.slug}`} className="card card-hover group flex flex-col !p-0 overflow-hidden">
      {project.cover ? (
        <img src={project.cover} alt="" loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <div className={`grid h-40 place-items-center bg-gradient-to-br ${gradients[project.category] ?? gradients.sayt}`}>
          <span className="text-5xl font-extrabold text-brand-600/30" aria-hidden>
            {t.projects.categories[project.category]?.charAt(0)}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="badge self-start">{t.projects.categories[project.category] ?? project.category}</span>
        <h3 className="mt-3 text-xl">{project.title}</h3>
        <p className="mt-2 flex-1 text-ink-700">{project.summary}</p>
        <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-700">
          {t.common.more}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  )
}
