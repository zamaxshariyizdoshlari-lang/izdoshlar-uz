import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Link, useLoaderData } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { ButtonLink, PageHeader } from '../components/ui'
import { t } from '../i18n'
import { trackEvent } from '../lib/analytics'
import { getProducts, type Product } from '../lib/api'

const p = t.products

export const loader = () => getProducts()

const gradients: Record<string, string> = {
  taqdimot: 'from-brand-100 to-sun-100',
  shablon: 'from-leaf-50 to-leaf-100',
  video: 'from-sun-100 to-brand-100',
  boshqa: 'from-cream-100 to-brand-50',
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card card-hover flex flex-col !p-0 overflow-hidden">
      {product.cover ? (
        <img src={product.cover} alt="" loading="lazy" className="h-44 w-full object-cover" />
      ) : (
        <div className={`grid h-44 place-items-center bg-gradient-to-br ${gradients[product.category] ?? gradients.boshqa}`}>
          <ShoppingBag className="h-10 w-10 text-brand-600/40" aria-hidden />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="badge self-start">{p.categories[product.category] ?? product.category}</span>
        <h2 className="mt-3 text-xl">{product.title}</h2>
        {product.description && <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-ink-700">{product.description}</p>}
        <p className="mt-4 text-lg font-extrabold text-brand-700">{product.price || p.priceOnRequest}</p>
        <Link
          to={`/aloqa?xizmat=content&mahsulot=${encodeURIComponent(product.title.slice(0, 120))}`}
          className="btn btn-primary mt-3"
          onClick={() => trackEvent('product_click', { slug: product.slug })}
        >
          {p.order} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}

export function Component() {
  const products = useLoaderData() as Product[]
  return (
    <>
      <Seo title={p.title} description={p.subtitle} path="/mahsulotlar" />
      <PageHeader title={p.title} subtitle={p.subtitle} />
      <section className="section">
        <div className="container-page">
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((x) => (
                <ProductCard key={x.slug} product={x} />
              ))}
            </div>
          ) : (
            <div className="card mx-auto max-w-2xl text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sun-100 text-brand-600">
                <ShoppingBag className="h-8 w-8" aria-hidden />
              </span>
              <h2 className="mt-4 text-2xl">{p.soonTitle}</h2>
              <p className="lead mt-3">{p.soonText}</p>
              <ButtonLink to="/aloqa?xizmat=content" className="mt-6">{p.cta}</ButtonLink>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
