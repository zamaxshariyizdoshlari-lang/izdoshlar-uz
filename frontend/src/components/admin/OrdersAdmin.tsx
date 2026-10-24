import { Download, ExternalLink, Phone, RefreshCw, Search, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { t } from '../../i18n'
import { ApiError, fetchOrders, updateOrder, type AdminOrder } from '../../lib/adminApi'

const a = t.admin
const c = t.contact
const STATUSES = Object.keys(a.statuses)

const statusStyle: Record<string, string> = {
  yangi: 'bg-amber-100 text-amber-800',
  muzokara: 'bg-orange-100 text-orange-800',
  jarayonda: 'bg-teal-100 text-teal-800',
  tugadi: 'bg-slate-100 text-slate-600',
}
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** CSV: Excel formulalari ("=", "+", "-", "@") ishga tushmasligi uchun boshiga ' qoʻyiladi. */
function csvCell(v: unknown): string {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function exportCsv(orders: AdminOrder[]) {
  const head = ['sana', 'tur', 'holat', 'ism', 'telefon', 'telegram', 'xizmat', 'paket', 'byudjet', 'maktab', 'oquvchilar', 'tavsif', 'izoh']
  const rows = orders.map((o) => [
    o.created_at, o.kind, o.status, o.name, o.phone, o.telegram, o.service_type, o.package, o.budget_range,
    o.school_name, o.student_count ?? '', o.description, o.admin_note,
  ])
  const text = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }))
  link.download = `buyurtmalar-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function OrderCard({ order, token, onChange }: { order: AdminOrder; token: string; onChange: (o: AdminOrder) => void }) {
  const [note, setNote] = useState(order.admin_note)
  const [msg, setMsg] = useState('')

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
    <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{order.name}</h2>
          <p className="text-sm text-slate-500">{fmt(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.kind === 'demo' && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{a.kindDemo}</span>}
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[order.status] ?? ''}`}>{a.statuses[order.status] ?? order.status}</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {order.phone && (
          <a className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`tel:${order.phone}`}>
            <Phone className="h-4 w-4" aria-hidden /> {order.phone}
          </a>
        )}
        {tg && (
          <a className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`https://t.me/${tg}`} target="_blank" rel="noopener noreferrer">
            <Send className="h-4 w-4" aria-hidden /> @{tg}
          </a>
        )}
        {order.file_url && /^https?:\/\//i.test(order.file_url) && (
          <a className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50" href={order.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden /> Fayl
          </a>
        )}
      </div>

      <p className="text-sm font-semibold text-slate-600">
        {c.serviceOptions[order.service_type] ?? order.service_type} · {c.packageOptions[order.package] ?? order.package} · {c.budgetOptions[order.budget_range] ?? order.budget_range}
      </p>
      {order.school_name && (
        <p className="text-sm text-slate-600">
          {a.school}: {order.school_name}
          {order.student_count ? `, ${order.student_count} ${a.students}` : ''}
          {order.current_system ? ` · ${a.system}: ${order.current_system}` : ''}
        </p>
      )}
      {order.description && <p className="whitespace-pre-wrap text-slate-700">{order.description}</p>}
      {!order.notified_at && <p className="text-sm text-slate-400">⚠ {a.notNotified}</p>}

      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor={`st-${order.id}`}>{a.status}</label>
          <select id={`st-${order.id}`} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold" value={order.status} onChange={(e) => save({ status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{a.statuses[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor={`nt-${order.id}`}>{a.note}</label>
          <textarea id={`nt-${order.id}`} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder={a.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} maxLength={3000} />
          <div className="mt-2 flex items-center gap-3">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={note === order.admin_note} onClick={() => save({ admin_note: note })}>
              {a.saveNote}
            </button>
            {msg && <span className="text-sm font-semibold text-slate-500" role="status">{msg}</span>}
          </div>
        </div>
      </div>
    </article>
  )
}

export function OrdersAdmin({ token, onExpired }: { token: string; onExpired: () => void }) {
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
      if (err instanceof ApiError && err.status === 401) onExpired()
      else setError(err instanceof ApiError && err.status === 403 ? a.forbidden : a.loadError)
    } finally {
      setLoading(false)
    }
  }, [token, onExpired])

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">Buyurtmalar</h1>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden /> {a.refresh}
          </button>
          <button onClick={() => orders && exportCsv(shown)} disabled={!orders?.length} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Download className="h-4 w-4" aria-hidden /> CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={a.status}>
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${filter === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {s === 'all' ? a.all : a.statuses[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3" type="search" placeholder={a.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={a.search} />
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      {orders && shown.length === 0 && !error && <p className="py-8 text-center text-slate-400">{a.empty}</p>}
      <div className="grid gap-5 xl:grid-cols-2">
        {shown.map((o) => (
          <OrderCard key={o.id} order={o} token={token} onChange={(u) => setOrders((prev) => prev?.map((x) => (x.id === u.id ? u : x)) ?? prev)} />
        ))}
      </div>
    </div>
  )
}
