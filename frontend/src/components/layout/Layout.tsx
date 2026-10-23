import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { t } from '../../i18n'
import { BRAND_NAME, CONTACT_PHONE, LEGAL_ADDRESS, LEGAL_INN, LEGAL_NAME, TELEGRAM_USERNAME } from '../../lib/config'

const links = [
  { to: '/loyihalar', label: t.nav.projects },
  { to: '/xizmatlar', label: t.nav.services },
  { to: '/narxlar', label: t.nav.pricing },
  { to: '/mahsulotlar', label: t.nav.products },
  { to: '/blog', label: t.nav.blog },
  { to: '/haqimda', label: t.nav.about },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white" aria-hidden>
        {BRAND_NAME.charAt(0).toUpperCase()}
      </span>
      {BRAND_NAME}
    </Link>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream-50/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Asosiy menyu">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 font-semibold transition hover:bg-brand-50 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/aloqa" className="btn btn-primary hidden !min-h-10 !px-5 !py-2 sm:inline-flex">
            {t.nav.order}
          </Link>
          <button
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-brand-50 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t.nav.menu}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-cream-50 lg:hidden" aria-label="Mobil menyu">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="rounded-xl px-3 py-3 font-semibold hover:bg-brand-50">
                {l.label}
              </NavLink>
            ))}
            <Link to="/aloqa" className="btn btn-primary mt-2">
              {t.nav.order}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-cream-100">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 text-ink-700">{t.footer.tagline}</p>
        </div>
        <div>
          <h2 className="mb-3 text-base">{t.footer.pages}</h2>
          <ul className="space-y-2 text-ink-700">
            {links.map((l) => (
              <li key={l.to}>
                <Link className="hover:text-brand-700" to={l.to}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-base">{t.footer.contacts}</h2>
          <ul className="space-y-2 text-ink-700">
            <li>
              <Link className="hover:text-brand-700" to="/aloqa">
                {t.nav.order}
              </Link>
            </li>
            {TELEGRAM_USERNAME && (
              <li>
                <a className="hover:text-brand-700" href={`https://t.me/${TELEGRAM_USERNAME.replace('@', '')}`} rel="noopener noreferrer">
                  Telegram: @{TELEGRAM_USERNAME.replace('@', '')}
                </a>
              </li>
            )}
            {CONTACT_PHONE && (
              <li>
                <a className="hover:text-brand-700" href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>
                  {CONTACT_PHONE}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-sm text-ink-500">
        <div className="container-page flex flex-col items-center gap-2">
          <nav aria-label={t.footer.legalTitle} className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            <Link className="hover:text-brand-700" to="/maxfiylik">{t.footer.privacy}</Link>
            <Link className="hover:text-brand-700" to="/oferta">{t.footer.offer}</Link>
          </nav>
          {(LEGAL_NAME || LEGAL_INN || LEGAL_ADDRESS) && (
            <p>
              {[LEGAL_NAME, LEGAL_INN && `STIR: ${LEGAL_INN}`, LEGAL_ADDRESS].filter(Boolean).join(' · ')}
            </p>
          )}
          <p>
        © {new Date().getFullYear()} {BRAND_NAME}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Asosiy qismga oʻtish
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
