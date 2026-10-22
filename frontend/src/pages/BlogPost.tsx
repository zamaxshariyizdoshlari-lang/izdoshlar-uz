import { ArrowLeft } from 'lucide-react'
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { CtaBand } from '../components/ui'
import { t } from '../i18n'
import { BRAND_NAME } from '../lib/config'
import { getPost } from '../lib/api'
import { formatDate, type Post } from '../lib/blog'
import { Component as NotFound } from './NotFound'

export const loader = ({ params }: LoaderFunctionArgs) => getPost(params.slug ?? '')

export function Component() {
  const post = useLoaderData() as Post | null
  if (!post) return <NotFound />

  return (
    <>
      <Seo
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          datePublished: post.date,
          description: post.description,
          author: { '@type': 'Organization', name: BRAND_NAME },
        }}
      />
      <article className="section">
        <div className="container-page max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 font-bold text-brand-700">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.nav.blog}
          </Link>
          <time className="mt-6 block text-sm font-semibold text-ink-500" dateTime={post.date}>{formatDate(post.date)}</time>
          <h1 className="h1 mt-2 !text-4xl sm:!text-5xl">{post.title}</h1>
          {/* Manba: repo ichidagi o'zimizning .md fayllar (tashqi kiritish yo'q) */}
          <div className="prose-blog mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
      </article>
      <CtaBand title={t.home.cta.title} text={t.home.cta.text} button={t.home.cta.button} />
    </>
  )
}
