import { Eye, EyeOff, ExternalLink, FileArchive, Link2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { DEMO_CATEGORIES } from '../../lib/demoCategories'
import { ApiError } from '../../lib/adminApi'
import { deleteDemo, extractZip, fetchDemos, saveDemo, setDemoPublished, type AdminDemo, type Extracted } from '../../lib/adminDemos'

const CATEGORIES = DEMO_CATEGORIES
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function DemoForm({ token, demo, onDone, onCancel, onExpired }: { token: string; demo: AdminDemo | null; onDone: (d: AdminDemo) => void; onCancel: () => void; onExpired: () => void }) {
  const [f, setF] = useState({
    title: demo?.title ?? '', description: demo?.description ?? '', category: demo?.category ?? 'sayt',
    kind: (demo?.kind ?? 'files') as 'url' | 'files', url: demo?.url ?? '', note: demo?.note ?? '', published: demo?.published ?? true, order: String(demo?.order ?? 0),
  })
  const [zip, setZip] = useState<Extracted | null>(null)
  const [zipBusy, setZipBusy] = useState(false)
  const [cover, setCover] = useState<File | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  async function pickZip(file: File | undefined) {
    setZip(null)
    setError('')
    if (!file) return
    setZipBusy(true)
    try {
      setZip(await extractZip(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zip'ni ochib bo'lmadi.")
    } finally {
      setZipBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (f.title.trim().length < 2) return setError('Nomini kiriting.')
    if (f.kind === 'url' && !/^https:\/\/[^\s]+$/i.test(f.url.trim())) return setError("Havola https:// bilan boshlanishi kerak.")
    if (f.kind === 'files' && !zip && (!demo || demo.kind !== 'files')) return setError('Sayt fayllarini (.zip) tanlang.')
    setBusy(true)
    try {
      onDone(
        await saveDemo(token, demo, {
          title: f.title.trim(), description: f.description.trim(), category: f.category, kind: f.kind, url: f.url.trim(), note: f.note.trim(),
          published: f.published, order: Number(f.order) || 0, coverFile: cover, removeCover: removeCover && !cover, zip,
        }, (done, total) => setProgress([done, total])),
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired()
      setError(err instanceof ApiError && err.status === 415 ? 'Rasm PNG, JPG yoki WebP boʻlsin.' : "Saqlab bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const input = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 focus:border-brand-500 focus:outline-none'
  const label = 'mb-1 block text-sm font-semibold text-slate-700'
  return (
    <form onSubmit={submit} className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={demo ? 'Demoni tahrirlash' : 'Yangi demo'}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{demo ? 'Demoni tahrirlash' : 'Yangi demo qoʻshish'}</h2>
        <button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Yopish"><X className="h-5 w-5" aria-hidden /></button>
      </div>

      <div>
        <label className={label} htmlFor="d-title">Nomi *</label>
        <input id="d-title" className={input} value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={150} />
      </div>
      <div>
        <label className={label} htmlFor="d-desc">Qisqa tavsif</label>
        <textarea id="d-desc" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" value={f.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label className={label} htmlFor="d-note">Kirish maʼlumoti (ixtiyoriy)</label>
        <textarea id="d-note" rows={2} maxLength={500} placeholder="Login: demo@izdoshlar.uz, Parol: demo1234" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={f.note} onChange={(e) => set('note', e.target.value)} />
        <p className="mt-1 text-sm text-slate-500">Sayt login talab qilsa, demo hisob maʼlumotini yozing: demo ochilganda hamma koʻradi. Haqiqiy login/parol yozmang, faqat test hisob va namuna maʼlumot bilan.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="d-cat">Toifa</label>
          <select id="d-cat" className={input} value={f.category} onChange={(e) => set('category', e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="d-order">Tartib</label>
          <input id="d-order" type="number" min={0} className={input} value={f.order} onChange={(e) => set('order', e.target.value)} />
        </div>
        <label className="flex items-end gap-2 pb-3 font-semibold">
          <input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} className="h-5 w-5 accent-brand-600" /> Saytda koʻrsatish
        </label>
      </div>

      <fieldset>
        <legend className={label}>Sayt qanday joylanadi?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([['files', FileArchive, 'Fayl yuklash (.zip)', 'HTML/CSS/JS fayllar sizning omboringizda saqlanadi'], ['url', Link2, 'Tayyor havola', 'Boshqa joyda ishlayotgan sayt (https://...)']] as const).map(([k, Icon, t, h]) => (
            <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${f.kind === k ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
              <input type="radio" name="d-kind" checked={f.kind === k} onChange={() => set('kind', k)} className="mt-1 h-4 w-4 accent-brand-600" />
              <span><span className="flex items-center gap-1.5 font-bold"><Icon className="h-4 w-4" aria-hidden /> {t}</span><span className="text-sm text-slate-500">{h}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {f.kind === 'url' ? (
        <div>
          <label className={label} htmlFor="d-url">Sayt havolasi *</label>
          <input id="d-url" type="url" className={input} placeholder="https://" value={f.url} onChange={(e) => set('url', e.target.value)} />
          <p className="mt-1 text-sm text-slate-500">Sayt boshqa saytda ochilishiga ruxsat bergan boʻlishi kerak (Vercel/Netlify'da odatda ruxsat bor).</p>
        </div>
      ) : (
        <div>
          <label className={label} htmlFor="d-zip">Sayt fayllari (.zip) {demo?.kind === 'files' ? '(almashtirish uchun)' : '*'}</label>
          <input id="d-zip" type="file" accept=".zip,application/zip" className="block w-full text-sm" onChange={(e) => pickZip(e.target.files?.[0])} />
          <p className="mt-1 text-sm text-slate-500">Oddiy statik sayt (HTML, CSS, JS, rasm, shrift). React/Vite saytni <code>base: './'</code> bilan build qilib, <code>dist</code> papkasini zip qiling. Zip ichida <code>index.html</code> boʻlsin. Eng koʻpi 40 MB. <strong>Ogohlantirish:</strong> sahifalari <code>BrowserRouter</code> bilan ishlaydigan yoki login/localStorage kerak boʻlgan React ilovalar zip ichida ishlamaydi. Ularni sayti internetda ochiq boʻlsa, «Tayyor havola» orqali qoʻshing.</p>
          {zipBusy && <p className="mt-2 text-sm font-semibold text-slate-500">Zip tekshirilmoqda...</p>}
          {zip && (
            <div className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
              <b>{zip.files.length} ta fayl</b>, {kb(zip.totalBytes)}. Asosiy sahifa: <code>{zip.entry}</code>
              {zip.warnings.map((w) => <p key={w} className="mt-1 text-amber-700">⚠ {w}</p>)}
            </div>
          )}
          {demo?.kind === 'files' && !zip && <p className="mt-2 text-sm text-slate-500">Hozirgi fayllar saqlanadi (yangi zip tanlamasangiz). Asosiy sahifa: <code>{demo.entry}</code></p>}
        </div>
      )}

      <div>
        <label className={label} htmlFor="d-cover">Muqova rasmi (ixtiyoriy)</label>
        <input id="d-cover" type="file" accept="image/png,image/jpeg,image/webp" className="block text-sm" onChange={(e) => { setCover(e.target.files?.[0] ?? null); setRemoveCover(false) }} />
        {demo?.cover && !cover && (
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} className="h-4 w-4" /> Rasmni olib tashlash</label>
        )}
      </div>

      {progress && (
        <div aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(progress[0] / progress[1]) * 100}%` }} /></div>
          <p className="mt-1 text-sm text-slate-500">Yuklanmoqda: {progress[0]} / {progress[1]}</p>
        </div>
      )}
      {error && <p className="text-sm font-semibold text-rose-600" role="alert">{error}</p>}
      <div className="flex gap-3">
        <button disabled={busy || zipBusy} className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? 'Saqlanmoqda...' : 'Saqlash'}</button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100">Bekor qilish</button>
      </div>
    </form>
  )
}

export function DemosAdmin({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [items, setItems] = useState<AdminDemo[] | null>(null)
  const [editing, setEditing] = useState<AdminDemo | 'new' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchDemos(token))
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onExpired()
      else setError("Demolarni yuklab bo'lmadi.")
    } finally {
      setLoading(false)
    }
  }, [token, onExpired])

  useEffect(() => { load() }, [load])

  async function toggle(d: AdminDemo) {
    try {
      const s = await setDemoPublished(token, d.id, !d.published)
      setItems((p) => p?.map((x) => (x.id === s.id ? s : x)) ?? p)
    } catch { setNotice('Saqlab boʻlmadi.') }
  }
  async function remove(d: AdminDemo) {
    if (!window.confirm(`Demo va uning barcha fayllari o'chiriladi. Davom etasizmi?\n\n«${d.title}»`)) return
    try {
      await deleteDemo(token, d)
      setItems((p) => p?.filter((x) => x.id !== d.id) ?? p)
      setNotice("Demo o'chirildi.")
    } catch { setNotice("O'chirib bo'lmadi.") }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Demolar</h1>
          <p className="text-sm text-slate-500">Tayyor saytlaringiz: mijozlar ularni sayt ichida sinab ko'radi.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden /> Yangilash
        </button>
      </div>

      {editing ? (
        <DemoForm token={token} demo={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onExpired={onExpired}
          onDone={(d) => {
            setItems((p) => { const l = p ?? []; return l.some((x) => x.id === d.id) ? l.map((x) => (x.id === d.id ? d : x)) : [...l, d] })
            setEditing(null)
            setNotice('Saqlandi.')
          }} />
      ) : (
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700" onClick={() => setEditing('new')}>
          <Plus className="h-5 w-5" aria-hidden /> Yangi demo qoʻshish
        </button>
      )}

      {notice && <p className="font-semibold text-emerald-700" role="status">{notice}</p>}
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      {items && !items.length && !error && <p className="py-6 text-center text-slate-400">Hali demo yo'q. Birinchi saytingizni qo'shing.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {items?.map((d) => (
          <article key={d.id} className={`flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${d.published ? '' : 'opacity-70'}`}>
            {d.cover ? <img src={d.cover} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" /> : (
              <div className="grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600/50" aria-hidden>{d.kind === 'files' ? <FileArchive className="h-7 w-7" /> : <Link2 className="h-7 w-7" />}</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-bold">{d.title}</h2>
                {!d.published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Yashirin</span>}
              </div>
              <p className="text-sm text-slate-500">{CATEGORIES[d.category] ?? d.category} · {d.kind === 'files' ? 'Fayllar' : 'Havola'} · /demolar/{d.slug}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a href={`/demolar/${d.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-semibold hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> Ko'rish</a>
                <button onClick={() => setEditing(d)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-semibold hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" aria-hidden /> Tahrirlash</button>
                <button onClick={() => toggle(d)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">{d.published ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}{d.published ? 'Yashirish' : "Ko'rsatish"}</button>
                <button onClick={() => remove(d)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" aria-hidden /> O'chirish</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
