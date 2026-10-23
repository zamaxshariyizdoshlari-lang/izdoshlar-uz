import { Bot, Check, Globe, Presentation, School } from 'lucide-react'
import { Seo } from '../components/layout/Seo'
import { ButtonLink, PageHeader } from '../components/ui'
import { t } from '../i18n'
import { ENABLE_BUSINESS } from '../lib/config'

const icons = { school: School, globe: Globe, bot: Bot, presentation: Presentation }

export function Component() {
  return (
    <>
      <Seo title={t.services.title} description={ENABLE_BUSINESS ? t.services.subtitle : t.services.subtitleSchools} path="/xizmatlar" />
      <PageHeader title={t.services.title} subtitle={ENABLE_BUSINESS ? t.services.subtitle : t.services.subtitleSchools} />
      <section className="section">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {t.services.items.filter((s) => ENABLE_BUSINESS || s.key === 'school' || s.key === 'content').map((s) => {
            const Icon = icons[s.icon as keyof typeof icons]
            return (
              <article key={s.key} id={s.key} className="card flex flex-col">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="h-7 w-7" aria-hidden />
                </span>
                <h2 className="mt-4 text-2xl">{s.title}</h2>
                <p className="mt-2 text-ink-700">{s.text}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {s.points.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-leaf-500" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
                <ButtonLink to={s.to} className="mt-6 self-start">{s.cta}</ButtonLink>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
