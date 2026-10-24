import { ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, MonitorPlay, Package, Settings, X, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Head } from 'vite-react-ssg'
import { DemosAdmin } from '../components/admin/DemosAdmin'
import { OrdersAdmin } from '../components/admin/OrdersAdmin'
import { ProductsAdmin } from '../components/admin/ProductsAdmin'
import { SettingsPage } from '../components/admin/SettingsPage'
import { StatsPage } from '../components/admin/StatsPage'
import { BRAND_NAME } from '../lib/config'
import { ApiError, clearToken, ensureFreshToken, getToken, login, logout } from '../lib/adminApi'
import { countNewOrders } from '../lib/adminExtra'

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
}
const NAV: NavItem[] = [
  { id: 'statistika', label: 'Statistika', icon: LayoutDashboard },
  { id: 'buyurtmalar', label: 'Buyurtmalar', icon: Inbox },
  { id: 'mahsulotlar', label: 'Mahsulotlar', icon: Package },
  { id: 'demolar', label: 'Demolar', icon: MonitorPlay },
  { id: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
]

function useHashPage(): [string, (id: string) => void] {
  const [page, setPage] = useState('statistika')
  useEffect(() => {
    const read = () => {
      const h = location.hash.replace('#', '')
      setPage(NAV.some((n) => n.id === h) ? h : 'statistika')
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  return [page, (id) => (location.hash = id)]
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onLogin(await login(email.trim(), pass, remember))
    } catch (err) {
      const s = err instanceof ApiError ? err.status : 0
      setError(s === 429 ? "Urinishlar ko'p. Keyinroq qayta urining." : s === 403 ? "Bu hisobda boshqaruv huquqi yo'q." : "Email yoki parol noto'g'ri.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="mb-2 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-xl font-extrabold text-white" aria-hidden>{BRAND_NAME.charAt(0).toUpperCase()}</span>
          <div>
            <h1 className="text-xl font-extrabold leading-tight text-slate-900">Boshqaruv paneli</h1>
            <p className="text-sm text-slate-500">{BRAND_NAME}</p>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="a-user">Email</label>
          <input id="a-user" type="email" className="h-11 w-full rounded-xl border border-slate-200 px-3 focus:border-brand-500 focus:outline-none" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="a-pass">Parol</label>
          <input id="a-pass" type="password" className="h-11 w-full rounded-xl border border-slate-200 px-3 focus:border-brand-500 focus:outline-none" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
          Bu qurilmada eslab qolish
        </label>
        {error && <p className="text-sm font-semibold text-rose-600" role="alert">{error}</p>}
        <button className="h-11 w-full rounded-xl bg-brand-600 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60" disabled={busy}>
          {busy ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  )
}

export function Component() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [page, goTo] = useHashPage()
  const [menu, setMenu] = useState(false)
  const [newOrders, setNewOrders] = useState(0)

  // Token faqat brauzerda oʻqiladi (prerender vaqtida boʻsh sahifa chiqadi)
  useEffect(() => {
    setToken(getToken())
    setReady(true)
  }, [])

  const handleLogout = useCallback(
    (expired?: boolean) => {
      const tk = token
      clearToken()
      setToken(null)
      if (tk && !expired) logout(tk).catch(() => {})
    },
    [token],
  )
  const onExpired = useCallback(() => handleLogout(true), [handleLogout])

  // Token muddati tugamasdan yangilab turadi (Supabase tokeni taxminan 1 soat yashaydi)
  useEffect(() => {
    if (!token) return
    let stop = false
    const tick = async () => {
      const fresh = await ensureFreshToken()
      if (stop) return
      if (!fresh) onExpired()
      else if (fresh !== token) setToken(fresh)
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [token, onExpired])

  // Yon menyudagi "yangi buyurtmalar" belgisi
  useEffect(() => {
    if (!token) return
    let stop = false
    const run = () => countNewOrders(token).then((n) => !stop && setNewOrders(n)).catch(() => {})
    run()
    const id = setInterval(run, 60_000)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [token, page])

  useEffect(() => setMenu(false), [page])

  const head = (
    <Head>
      <title>Boshqaruv</title>
      <meta name="robots" content="noindex, nofollow" />
    </Head>
  )

  if (!ready) return head
  if (!token) {
    return (
      <>
        {head}
        <LoginScreen onLogin={setToken} />
      </>
    )
  }

  const nav = (
    <nav className="flex-1 space-y-1 px-3" aria-label="Boshqaruv menyusi">
      {NAV.map((n) => {
        const active = page === n.id
        return (
          <a
            key={n.id}
            href={`#${n.id}`}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <n.icon className="h-5 w-5" aria-hidden />
            <span className="flex-1">{n.label}</span>
            {n.id === 'buyurtmalar' && newOrders > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${newOrders} ta yangi`}>{newOrders}</span>
            )}
          </a>
        )
      })}
    </nav>
  )

  const sidebarBody = (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg font-extrabold text-white" aria-hidden>{BRAND_NAME.charAt(0).toUpperCase()}</span>
        <span className="text-lg font-extrabold text-slate-900">{BRAND_NAME}</span>
      </div>
      {nav}
      <div className="space-y-1 border-t border-slate-200 p-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-slate-600 hover:bg-slate-100">
          <ExternalLink className="h-5 w-5" aria-hidden /> Saytni ko'rish
        </a>
        <button onClick={() => handleLogout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-slate-600 hover:bg-slate-100">
          <LogOut className="h-5 w-5" aria-hidden /> Chiqish
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {head}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">{sidebarBody}</aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100" onClick={() => setMenu(true)} aria-label="Menyuni ochish">
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <span className="font-extrabold">{NAV.find((n) => n.id === page)?.label}</span>
        <span className="w-10" />
      </header>

      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/40" onClick={() => setMenu(false)} aria-label="Yopish" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-2xl">
            <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" onClick={() => setMenu(false)} aria-label="Yopish">
              <X className="h-5 w-5" aria-hidden />
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      <main className="px-4 py-6 sm:px-8 lg:ml-64 lg:py-8">
        <div className="mx-auto max-w-6xl">
          {page === 'statistika' && <StatsPage token={token} onExpired={onExpired} />}
          {page === 'buyurtmalar' && <OrdersAdmin token={token} onExpired={onExpired} />}
          {page === 'mahsulotlar' && <ProductsAdmin token={token} onLogout={handleLogout} />}
          {page === 'demolar' && <DemosAdmin token={token} onExpired={onExpired} />}
          {page === 'sozlamalar' && <SettingsPage token={token} onExpired={onExpired} />}
          {/* "Yana" sahifalar (demolar, kontent) keyingi bosqichda qoʻshiladi */}
          <span hidden>{goTo.length}</span>
        </div>
      </main>
    </div>
  )
}
