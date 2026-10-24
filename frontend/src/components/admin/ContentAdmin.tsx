import { Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, raw } from '../../lib/adminApi'

type FieldType = 'text' | 'textarea' | 'number' | 'bool' | 'date' | 'select' | 'lines'
interface Field {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: Record<string, string>
  hint?: string
  rows?: number
}
interface Section {
  id: string
  label: string
  table: string
  title: string // roʻyxatda sarlavha boʻladigan maydon
  sub?: string // ostidagi qoʻshimcha satr
  order: string
  slug?: boolean // sarlavhadan slug yasaladi
  hasOrder: boolean
  fields: Field[]
  defaults: Record<string, unknown>
}

const PUB: Field = { key: 'published', label: 'Saytda koʻrsatish', type: 'bool' }
const ORD: Field = { key: 'sort_order', label: 'Tartib raqami', type: 'number', hint: 'Kichigi birinchi chiqadi' }

const SECTIONS: Section[] = [
  {
    id: 'faq', label: 'Savol-javob', table: 'faq', title: 'question', sub: 'scope', order: 'scope.asc,sort_order.asc,id.asc', hasOrder: true,
    defaults: { scope: 'home', question: '', answer: '', published: true, sort_order: 0 },
    fields: [
      { key: 'scope', label: 'Qaysi sahifada', type: 'select', options: { home: 'Bosh sahifa', pricing: 'Narxlar' }, required: true },
      { key: 'question', label: 'Savol', type: 'text', required: true },
      { key: 'answer', label: 'Javob', type: 'textarea', required: true },
      ORD, PUB,
    ],
  },
  {
    id: 'testimonials', label: 'Mijoz fikrlari', table: 'testimonials', title: 'author', sub: 'role', order: 'sort_order.asc,id.asc', hasOrder: true,
    defaults: { author: '', role: '', text: '', published: true, sort_order: 0 },
    fields: [
      { key: 'author', label: 'Ism', type: 'text', required: true },
      { key: 'role', label: 'Lavozim, tashkilot', type: 'text' },
      { key: 'text', label: 'Fikr', type: 'textarea', required: true, hint: 'Faqat haqiqiy mijoz fikri, ruxsati bilan' },
      ORD, PUB,
    ],
  },
  {
    id: 'posts', label: 'Blog', table: 'posts', title: 'title', sub: 'date', order: 'date.desc,id.desc', slug: true, hasOrder: false,
    defaults: { slug: '', title: '', description: '', body: '', date: new Date().toISOString().slice(0, 10), published: true },
    fields: [
      { key: 'title', label: 'Sarlavha', type: 'text', required: true },
      { key: 'slug', label: 'Havola nomi (slug)', type: 'text', required: true, hint: 'Lotin harf, raqam va chiziqcha. Boʻsh qoldirsangiz sarlavhadan yasaladi' },
      { key: 'description', label: 'Qisqa tavsif (Google uchun)', type: 'textarea', rows: 2 },
      { key: 'body', label: 'Matn (Markdown)', type: 'textarea', rows: 14, hint: '## sarlavha, **qalin**, - roʻyxat, [matn](havola)' },
      { key: 'date', label: 'Sana', type: 'date', required: true },
      PUB,
    ],
  },
  {
    id: 'projects', label: 'Loyiha matnlari', table: 'projects', title: 'title', sub: 'category', order: 'sort_order.asc,id.asc', slug: true, hasOrder: true,
    defaults: { slug: '', title: '', category: 'sayt', summary: '', problem: '', solution: '', result: '', tech: [], featured: false, placeholder: false, published: true, sort_order: 0 },
    fields: [
      { key: 'title', label: 'Nomi', type: 'text', required: true },
      { key: 'slug', label: 'Havola nomi (slug)', type: 'text', required: true },
      { key: 'category', label: 'Toifa', type: 'select', options: { sayt: 'Sayt', erp: 'ERP', 'ai-bot': 'AI / Bot', kontent: 'Kontent' }, required: true },
      { key: 'summary', label: 'Qisqa tavsif', type: 'textarea', rows: 2 },
      { key: 'problem', label: 'Muammo', type: 'textarea', rows: 3 },
      { key: 'solution', label: 'Yechim', type: 'textarea', rows: 3 },
      { key: 'result', label: 'Natija', type: 'textarea', rows: 3 },
      { key: 'tech', label: 'Texnologiyalar', type: 'lines', hint: 'Har biri alohida qatorda' },
      { key: 'featured', label: 'Bosh sahifada koʻrsatish', type: 'bool' },
      ORD, PUB,
    ],
  },
  {
    id: 'packages', label: 'Narx paketlari', table: 'packages', title: 'name', sub: 'price_text', order: 'sort_order.asc,id.asc', hasOrder: true,
    defaults: { key: '', name: '', tagline: '', price_text: '', popular: false, features: [], published: true, sort_order: 0 },
    fields: [
      { key: 'name', label: 'Paket nomi', type: 'text', required: true },
      { key: 'key', label: 'Kalit (start, biznes...)', type: 'text', required: true, hint: 'Buyurtma formasi shu kalitni ishlatadi, mavjudini oʻzgartirmang' },
      { key: 'tagline', label: 'Qisqa izoh', type: 'text' },
      { key: 'price_text', label: 'Narx matni', type: 'text', hint: 'Masalan: 3 000 000 soʻmdan' },
      { key: 'features', label: 'Imkoniyatlar', type: 'lines', hint: 'Har biri alohida qatorda' },
      { key: 'popular', label: '"Eng ommabop" belgisi', type: 'bool' },
      ORD, PUB,
    ],
  },
  {
    id: 'addons', label: 'Qoʻshimcha xizmatlar', table: 'addons', title: 'name', sub: 'price_text', order: 'sort_order.asc,id.asc', hasOrder: true,
    defaults: { name: '', text: '', price_text: '', published: true, sort_order: 0 },
    fields: [
      { key: 'name', label: 'Nomi', type: 'text', required: true },
      { key: 'text', label: 'Izoh', type: 'text' },
      { key: 'price_text', label: 'Narx matni', type: 'text' },
      ORD, PUB,
    ],
  },
]

type Row = Record<string, unknown> & { id: number }

const input = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 focus:border-brand-500 focus:outline-none'
const area = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const label = 'mb-1 block text-sm font-semibold text-slate-700'

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ʻʼ'`’‘]/g, '')
    .replace(/o‘|oʻ/g, 'o')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function toForm(sec: Section, row: Row | null): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}
  for (const f of sec.fields) {
    const v = row ? row[f.key] : sec.defaults[f.key]
    out[f.key] = f.type === 'bool' ? !!v : f.type === 'lines' ? ((v as string[] | null) ?? []).join('\n') : v == null ? '' : String(v)
  }
  return out
}

function toPayload(sec: Section, form: Record<string, string | boolean>) {
  const body: Record<string, unknown> = {}
  for (const f of sec.fields) {
    const v = form[f.key]
    if (f.type === 'bool') body[f.key] = !!v
    else if (f.type === 'number') body[f.key] = Number(v) || 0
    else if (f.type === 'lines') body[f.key] = String(v).split('\n').map((x) => x.trim()).filter(Boolean)
    else body[f.key] = String(v).trim()
  }
  if (sec.slug && !body.slug) body.slug = slugify(String(body.title))
  if (sec.slug && body.slug) body.slug = slugify(String(body.slug))
  return body
}

function SectionForm({ sec, row, token, onDone, onCancel, onExpired }: { sec: Section; row: Row | null; token: string; onDone: () => void; onCancel: () => void; onExpired: () => void }) {
  const [form, setForm] = useState(() => toForm(sec, row))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const missing = sec.fields.find((f) => f.required && !String(form[f.key]).trim() && !(sec.slug && f.key === 'slug' && String(form.title).trim()))
    if (missing) return setError(`"${missing.label}" toʻldirilishi kerak.`)
    setBusy(true)
    setError('')
    try {
      const body = JSON.stringify(toPayload(sec, form))
      if (row) await raw(`/rest/v1/${sec.table}?id=eq.${row.id}`, { method: 'PATCH', token, body })
      else await raw(`/rest/v1/${sec.table}`, { method: 'POST', token, body })
      onDone()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired()
      setError(err instanceof ApiError && err.status === 409 ? 'Bunday havola nomi yoki kalit allaqachon bor. Boshqasini tanlang.' : "Saqlab bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={row ? 'Tahrirlash' : "Yangi qo'shish"}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{row ? 'Tahrirlash' : "Yangi qo'shish"}: {sec.label}</h3>
        <button type="button" onClick={onCancel} aria-label="Yopish" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      {sec.fields.map((f) => {
        const id = `c-${f.key}`
        const set = (v: string | boolean) => setForm((x) => ({ ...x, [f.key]: v }))
        if (f.type === 'bool')
          return (
            <label key={f.key} className="flex items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(e.target.checked)} className="h-5 w-5" /> {f.label}
            </label>
          )
        return (
          <div key={f.key}>
            <label className={label} htmlFor={id}>{f.label}{f.required && ' *'}</label>
            {f.type === 'textarea' || f.type === 'lines' ? (
              <textarea id={id} rows={f.rows ?? (f.type === 'lines' ? 5 : 4)} className={area} value={String(form[f.key])} onChange={(e) => set(e.target.value)} />
            ) : f.type === 'select' ? (
              <select id={id} className={input} value={String(form[f.key])} onChange={(e) => set(e.target.value)}>
                {Object.entries(f.options ?? {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : (
              <input id={id} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className={input} value={String(form[f.key])} onChange={(e) => set(e.target.value)} />
            )}
            {f.hint && <p className="mt-1 text-sm text-slate-500">{f.hint}</p>}
          </div>
        )
      })}
      {error && <p role="alert" className="font-semibold text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? 'Saqlanmoqda...' : 'Saqlash'}</button>
        <button type="button" onClick={onCancel} className="rounded-xl px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100">Bekor qilish</button>
      </div>
    </form>
  )
}

export function ContentAdmin({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [secId, setSecId] = useState(SECTIONS[0].id)
  const sec = SECTIONS.find((s) => s.id === secId)!
  const [rows, setRows] = useState<Row[] | null>(null)
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setRows(null)
    setError('')
    try {
      setRows(await (await raw(`/rest/v1/${sec.table}?select=*&order=${sec.order}`, { token })).json())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired()
      setError("Ma'lumotni olib bo'lmadi.")
    }
  }, [sec, token, onExpired])

  useEffect(() => {
    setEditing(null)
    setMsg('')
    load()
  }, [load])

  async function act(fn: () => Promise<unknown>, ok: string) {
    setMsg('')
    setError('')
    try {
      await fn()
      setMsg(ok)
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired()
      setError("Bajarib bo'lmadi.")
    }
  }

  const toggle = (r: Row) => act(() => raw(`/rest/v1/${sec.table}?id=eq.${r.id}`, { method: 'PATCH', token, body: JSON.stringify({ published: !r.published }) }), r.published ? 'Yashirildi.' : "Saytda ko'rsatiladi.")
  const remove = (r: Row) => {
    if (!window.confirm(`"${String(r[sec.title])}" butunlay o'chirilsinmi?`)) return
    act(() => raw(`/rest/v1/${sec.table}?id=eq.${r.id}`, { method: 'DELETE', token }), "O'chirildi.")
  }

  return (
    <div>
      <p className="mb-4 text-slate-500">Sayt matnlarini shu yerdan o‘zgartiring. O‘zgarish saytda bir necha daqiqada ko‘rinadi (ayrim sahifalar keyingi joylashtirishdan keyin).</p>
      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {SECTIONS.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === secId} onClick={() => setSecId(s.id)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${s.id === secId ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{s.label}</button>
        ))}
      </div>
      <div className="mb-5 flex gap-3">
        <button onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700"><Plus className="h-5 w-5" /> Yangi qo‘shish</button>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-600"><RefreshCw className="h-4 w-4" /> Yangilash</button>
      </div>
      {editing && (
        <SectionForm key={editing === 'new' ? 'new' : editing.id} sec={sec} row={editing === 'new' ? null : editing} token={token} onExpired={onExpired} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); setMsg('Saqlandi.'); load() }} />
      )}
      {msg && <p className="mb-3 font-semibold text-emerald-700" role="status">{msg}</p>}
      {error && <p className="mb-3 font-semibold text-red-600" role="alert">{error}</p>}
      {rows === null && !error && <p className="text-slate-500">Yuklanmoqda...</p>}
      {rows?.length === 0 && <p className="text-slate-500">Hali hech narsa yo‘q.</p>}
      <ul className="space-y-3">
        {rows?.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className={`truncate font-bold ${r.published ? '' : 'text-slate-400 line-through'}`}>{String(r[sec.title] || '(nomsiz)')}</p>
              {sec.sub && <p className="truncate text-sm text-slate-500">{String(r[sec.sub] ?? '')}</p>}
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setEditing(r)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100"><Pencil className="h-4 w-4" /> Tahrirlash</button>
              <button onClick={() => toggle(r)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">{r.published ? <><EyeOff className="h-4 w-4" /> Yashirish</> : <><Eye className="h-4 w-4" /> Ko‘rsatish</>}</button>
              <button onClick={() => remove(r)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> O‘chirish</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
