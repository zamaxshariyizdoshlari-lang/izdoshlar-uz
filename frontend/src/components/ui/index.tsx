import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = {
  to?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
  className?: string
}

export function ButtonLink({ to = '/', variant = 'primary', children, className = '' }: ButtonProps) {
  return (
    <Link to={to} className={`btn btn-${variant} ${className}`}>
      {children}
    </Link>
  )
}

export function SectionHeading({ title, subtitle, center = true }: { title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <h2 className="h2">{title}</h2>
      {subtitle && <p className="lead mt-3">{subtitle}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="bg-cream-100 border-b border-line">
      <div className="container-page py-12 sm:py-16">
        <h1 className="h1 max-w-3xl">{title}</h1>
        {subtitle && <p className="lead mt-4 max-w-2xl">{subtitle}</p>}
      </div>
    </header>
  )
}

// <details> ishlatilgan: JS talab qilmaydi, klaviatura va ekran oʻquvchi bilan ishlaydi
export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((it) => (
        <details key={it.q} className="group card !p-0 open:shadow-lift">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold [&::-webkit-details-marker]:hidden">
            {it.q}
            <ChevronDown className="h-5 w-5 shrink-0 text-brand-600 transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="px-5 pb-5 text-ink-700">{it.a}</p>
        </details>
      ))}
    </div>
  )
}

export function CtaBand({ title, text, button, to = '/aloqa' }: { title: string; text: string; button: string; to?: string }) {
  return (
    <section className="section">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-12 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-500/60" aria-hidden />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-sun-400/40" aria-hidden />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-lg text-white">{text}</p>
          <Link to={to} className="btn relative mt-7 bg-white text-brand-700 hover:-translate-y-0.5 hover:shadow-lift">
            {button}
          </Link>
        </div>
      </div>
    </section>
  )
}
