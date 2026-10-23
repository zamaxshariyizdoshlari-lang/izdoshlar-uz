import { Eye, EyeOff, ImagePlus, LogOut, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { t } from '../../i18n'
import {
  ApiError,
  deleteProduct,
  fetchProducts,
  saveProduct,
  setProductPublished,
  type AdminProduct,
} from '../../lib/adminApi'

const a = t.admin
const p = a.products

interface FormState {
  title: string
  description: string
  category: string
  price: string
  published: boolean
  order: string
}

const empty: FormState = { title: '', description: '', category: 'taqdimot', price: '', published: true, order: '0' }

function toForm(x: AdminProduct): FormState {
  return { title: x.title, description: x.description, category: x.category, price: x.price, published: x.published, order: String(x.order) }
}

/** Server xatosini (400) maydonlar boʻyicha ajratadi. */
function fieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && err.status === 415) return { cover: p.coverHint }
  const msg = err instanceof ApiError && err.body && typeof err.body === 'object' ? String((err.body as { message?: string }).message ?? '') : ''
  if (msg.includes('products_title_check')) return { title: p.errTitle }
  if (msg.toLowerCase().includes('size') || msg.toLowerCase().includes('exceeded')) return { cover: p.coverHint }
  return { _: a.saveError }
}

function ProductForm({
  token,
  product,
  onDone,
  onCancel,
  onExpired,
}: {
  token: string
  product: AdminProduct | null
  onDone: (saved: AdminProduct) => void
  onCancel: () => void
  onExpired: () => void
}) {
  const [form, setForm] = useState<FormState>(product ? toForm(product) : empty)
  const [file, setFile] = useState<File | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const preview = file ? URL.createObjectURL(file) : removeCover ? null : product?.cover

  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(preview as string)
    }
  }, [file, preview])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 2) return setErrors({ title: p.errTitle })
    setBusy(true)
    setErrors({})
    try {
      onDone(
        await saveProduct(token, product, {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          price: form.price.trim(),
          published: form.published,
          order: Number(form.order) || 0,
          file,
          removeCover: removeCover && !file,
        }),
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired()
      setErrors(fieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-sm font-semibold text-red-600" role="alert">{errors[k]}</p> : null)

  return (
    <form onSubmit={submit} className="card mb-8 space-y-4" aria-label={product ? p.edit : p.add}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl">{product ? p.edit : p.add}</h2>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50" onClick={onCancel} aria-label={p.cancel}>
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div>
        <label className="label" htmlFor="p-title">{p.title} *</label>
        <input id="p-title" className={`field ${errors.title ? 'field-error' : ''}`} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={150} />
        {err('title')}
      </div>
      <div>
        <label className="label" htmlFor="p-desc">{p.description}</label>
        <textarea id="p-desc" rows={4} className="field" value={form.description} onChange={(e) => set('description', e.target.value)} />
        {err('description')}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="p-cat">{p.category}</label>
          <select id="p-cat" className="field" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {Object.entries(t.products.categories).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="p-price">{p.price}</label>
          <input id="p-price" className="field" placeholder={p.pricePlaceholder} value={form.price} onChange={(e) => set('price', e.target.value)} maxLength={60} />
          {err('price')}
        </div>
        <div>
          <label className="label" htmlFor="p-order">{p.order}</label>
          <input id="p-order" type="number" min={0} className="field" value={form.order} onChange={(e) => set('order', e.target.value)} />
        </div>
      </div>

      <div>
        <span className="label">{p.cover}</span>
        <div className="flex flex-wrap items-center gap-4">
          {preview ? (
            <img src={preview} alt="" className="h-24 w-32 rounded-xl border border-line object-cover" />
          ) : (
            <div className="grid h-24 w-32 place-items-center rounded-xl border-2 border-dashed border-line text-ink-500">
              <ImagePlus className="h-6 w-6" aria-hidden />
            </div>
          )}
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="block text-sm"
              aria-label={p.cover}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setRemoveCover(false)
              }}
            />
            <p className="text-sm text-ink-500">{p.coverHint}</p>
            {product?.cover && !file && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} className="h-4 w-4" />
                {p.removeCover}
              </label>
            )}
          </div>
        </div>
        {err('cover')}
      </div>

      <label className="flex items-center gap-2 font-semibold">
        <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="h-5 w-5 accent-brand-600" />
        {p.published}
      </label>

      {errors._ && <p className="font-semibold text-red-600" role="alert">{errors._}</p>}
      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? p.saving : p.save}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{p.cancel}</button>
      </div>
    </form>
  )
}

export function ProductsAdmin({ token, onLogout, tabs }: { token: string; onLogout: (expired?: boolean) => void; tabs: ReactNode }) {
  const [items, setItems] = useState<AdminProduct[] | null>(null)
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await fetchProducts(token))
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

  async function toggle(x: AdminProduct) {
    try {
      const saved = await setProductPublished(token, x.id, !x.published)
      setItems((prev) => prev?.map((i) => (i.id === saved.id ? saved : i)) ?? prev)
    } catch {
      setNotice(a.saveError)
    }
  }

  async function remove(x: AdminProduct) {
    if (!window.confirm(`${p.confirmDelete}\n\n«${x.title}»`)) return
    try {
      await deleteProduct(token, x)
      setItems((prev) => prev?.filter((i) => i.id !== x.id) ?? prev)
      setNotice(p.deleted)
    } catch {
      setNotice(a.saveError)
    }
  }

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
      {tabs}

      {editing ? (
        <ProductForm
          token={token}
          product={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onExpired={() => onLogout(true)}
          onDone={(saved) => {
            setItems((prev) => {
              const list = prev ?? []
              return list.some((i) => i.id === saved.id) ? list.map((i) => (i.id === saved.id ? saved : i)) : [...list, saved]
            })
            setEditing(null)
            setNotice(p.saved)
          }}
        />
      ) : (
        <button className="btn btn-primary mb-6" onClick={() => setEditing('new')}>
          <Plus className="h-5 w-5" aria-hidden /> {p.add}
        </button>
      )}

      {notice && <p className="mb-4 font-semibold text-leaf-600" role="status">{notice}</p>}
      {error && <p className="mb-4 font-semibold text-red-600" role="alert">{error}</p>}
      {items && items.length === 0 && !error && <p className="lead">{p.empty}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {items?.map((x) => (
          <article key={x.id} className={`card flex gap-4 ${x.published ? '' : 'opacity-75'}`}>
            {x.cover ? (
              <img src={x.cover} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-brand-50 text-3xl font-extrabold text-brand-600/40" aria-hidden>
                {x.title.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg">{x.title}</h2>
                {!x.published && <span className="badge !bg-line !text-ink-700">{p.hidden}</span>}
              </div>
              <p className="text-sm text-ink-500">
                {t.products.categories[x.category] ?? x.category}
                {x.price ? ` · ${x.price}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn btn-secondary !min-h-9 !px-3 !py-1.5 text-sm" onClick={() => setEditing(x)}>
                  <Pencil className="h-4 w-4" aria-hidden /> {p.editShort}
                </button>
                <button className="btn btn-ghost !min-h-9 !px-3 !py-1.5 text-sm" onClick={() => toggle(x)}>
                  {x.published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  {x.published ? p.hide : p.show}
                </button>
                <button className="btn btn-ghost !min-h-9 !px-3 !py-1.5 text-sm !text-red-600 hover:!bg-red-50" onClick={() => remove(x)}>
                  <Trash2 className="h-4 w-4" aria-hidden /> {p.delete}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
