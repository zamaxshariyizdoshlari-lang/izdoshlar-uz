import { ExternalLink, LogOut, Phone, RefreshCw, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Head } from 'vite-react-ssg'
import { t } from '../i18n'
import {
  ApiError,
  clearToken,
  fetchOrders,
  getToken,
  login,
  logout,
  updateOrder,
  type AdminOrder,
} from '../lib/adminApi'

const a = t.admin
const STATUSES = Object.keys(a.statuses)

const statusStyle: Record<string, string> = {
  yangi: 'bg-sun-100 text-ink-900',
  muzokara: 'bg-brand-50 text-brand-700',
  jarayonda: 'bg-leaf-50 text-leaf-600',
  tugadi: 'bg-line text-ink-700',
}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

function fmt(iso: string) {
  const d = new Date(iso)
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${hm}`
}

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onLogin(await login(user.trim(), pass, remember))
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? a.tooMany : a.badLogin)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl">{a.loginTitle}</h1>
      <div>
        <label className="label" htmlFor="a-user">{a.username}</label>
        <input id="a-user" className="field" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" autoCapitalize="none" required />
      </div>
      <div>
        <label className="label" htmlFor="a-pass">{a.password}</label>
        <input id="a-pass" type="password" className="field" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" />
        {a.remember}
      </label>
      {error && <p className="font-semibold text-red-600" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{a.login}</button>
    </form>
  )
}

function OrderCard({ order, token, onChange }: { order: AdminOrder; token: string; onChange: (o: AdminOrder) => void }) {
  const [note, setNote] = useState(order.admin_note)
  const [msg, setMsg] = useState('')
  const c = t.contact

  async function save(patch: Parameters<typeof updateOrder>[2]) {
    setMsg('')
    try {
      onChange(await updateOrder(token, order.id, patch))
      setMsg(a.saved)
    } catch {
      setMsg(a.saveError)
    }
  }

  const tg = order.telegram.replace('@', '')
  return (
    <article className="card space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg">{order.name}</h2>
          <p className="text-sm text-ink-500">{fmt(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.kind === 'demo' && <span className="badge badge-leaf">{a.kindDemo}</span>}
          <span className={`badge ${statusStyle[order.status] ?? ''}`}>{a.statuses[order.status] ?? order.status}</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {order.phone && (
          <a className="btn btn-secondary !min-h-10 !px-4 !py-2" href={`tel:${order.phone}`}>
            <Phone className="h-4 w-4" aria-hidden /> {order.phone}
          </a>
        )}
        {tg && (
          <a className="btn btn-secondary !min-h-10 !px-4 !py-2" href={`https://t.me/${tg}`} target="_blank" rel="noopener noreferrer">
            <Send className="h-4 w-4" aria-hidden /> @{tg}
          </a>
        )}
        {order.file_url && /^https?:\/\//i.test(order.file_url) && (
          <a className="btn btn-ghost !min-h-10 !px-4 !py-2" href={order.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden /> Fayl
          </a>
        )}
      </div>

      <p className="text-sm font-semibold text-ink-700">
        {c.serviceOptions[order.service_type] ?? order.service_type} · {c.packageOptions[order.package] ?? order.package} · {c.budgetOptions[order.budget_range] ?? order.budget_range}
      </p>
      {order.school_name && (
        <p className="text-sm text-ink-700">
          {a.school}: {order.school_name}
          {order.student_count ? `, ${order.student_count} ${a.students}` : ''}
          {order.current_system ? ` · ${a.system}: ${order.current_system}` : ''}
        </p>
      )}
      {order.description && <p className="whitespace-pre-wrap text-ink-700">{order.description}</p>}
      {!order.notified_at && <p className="text-sm text-ink-500">⚠ {a.notNotified}</p>}

      <div>
        <label className="label" htmlFor={`st-${order.id}`}>{a.status}</label>
        <select id={`st-${order.id}`} className="field" value={order.status} onChange={(e) => save({ status: e.target.value })}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{a.statuses[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`nt-${order.id}`}>{a.note}</label>
        <textarea id={`nt-${order.id}`} rows={2} className="field" placeholder={a.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} maxLength={3000} />
        <div className="mt-2 flex items-center gap-3">
          <button className="btn btn-secondary !min-h-10 !px-4 !py-2" disabled={note === order.admin_note} onClick={() => save({ admin_note: note })}>
            {a.saveNote}
          </button>
          {msg && <span className="text-sm font-semibold text-ink-500" role="status">{msg}</span>}
        </div>
      </div>
    </article>
  )
}

function Dashboard({ token, onLogout }: { token: string; onLogout: (expired?: boolean) => void }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await fetchOrders(token))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onLogout(true)
      else setError(err instanceof ApiError && err.status === 403 ? a.forbidden : a.loadError)
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: orders?.length ?? 0 }
    orders?.forEach((o) => (m[o.status] = (m[o.status] ?? 0) + 1))
    return m
  }, [orders])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (orders ?? []).filter(
      (o) =>
        (filter === 'all' || o.status === filter) &&
        (!needle || [o.name, o.phone, o.telegram, o.description, o.school_name, o.admin_note].some((v) => v.toLowerCase().includes(needle))),
    )
  }, [orders, filter, q])

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{a.title}</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary !min-h-10 !px-4 !py-2" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden /> {a.refresh}
          </button>
          <button className="btn btn-ghost !min-h-10 !px-4 !py-2" onClick={() => onLogout()}>
            <LogOut className="h-4 w-4" aria-hidden /> {a.logout}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={a.status}>
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${filter === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-700'}`}
          >
            {s === 'all' ? a.all : a.statuses[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>
      <input className="field mb-6" type="search" placeholder={a.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={a.search} />

      {error && <p className="mb-4 font-semibold text-red-600" role="alert">{error}</p>}
      {orders && shown.length === 0 && !error && <p className="lead">{a.empty}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {shown.map((o) => (
          <OrderCard key={o.id} order={o} token={token} onChange={(u) => setOrders((prev) => prev?.map((x) => (x.id === u.id ? u : x)) ?? prev)} />
        ))}
      </div>
    </>
  )
}

export function Component() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

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

  return (
    <section className="section">
      <Head>
        <title>{a.title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="container-page">
        {ready && (token ? <Dashboard token={token} onLogout={handleLogout} /> : <LoginForm onLogin={setToken} />)}
      </div>
    </section>
  )
}
