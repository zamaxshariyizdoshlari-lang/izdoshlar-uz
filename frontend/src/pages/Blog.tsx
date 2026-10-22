import { Link, useLoaderData } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { PageHeader } from '../components/ui'
import { t } from '../i18n'
import { getPosts } from '../lib/api'
import { formatDate, type Post } from '../lib/blog'

export const loader = () => getPosts()

export function Component() {
  const posts = useLoaderData() as Post[]
  return (
    <>
      <Seo title={t.blog.title} description={t.blog.subtitle} path="/blog" />
      <PageHeader title={t.blog.title} subtitle={t.blog.subtitle} />
      <section className="section">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {posts.length === 0 && <p className="lead">{t.blog.empty}</p>}
          {posts.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="card card-hover">
              <time className="text-sm font-semibold text-ink-500" dateTime={p.date}>{formatDate(p.date)}</time>
              <h2 className="mt-1 text-xl">{p.title}</h2>
              <p className="mt-2 text-ink-700">{p.description}</p>
              <span className="mt-3 inline-block font-bold text-brand-700">{t.blog.readMore} →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
