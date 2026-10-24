import { KeyRound, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/adminApi'
import { changePassword, getAccount } from '../../lib/adminExtra'

export function SettingsPage({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getAccount(token)
      .then((u) => setEmail(u.email))
      .catch((err) => err instanceof ApiError && err.status === 401 && onExpired())
  }, [token, onExpired])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (pw.length < 10) return setMsg({ ok: false, text: "Parol kamida 10 ta belgidan iborat bo'lsin." })
    if (pw !== pw2) return setMsg({ ok: false, text: 'Parollar mos kelmadi.' })
    setBusy(true)
    try {
      await changePassword(token, pw)
      setPw('')
      setPw2('')
      setMsg({ ok: true, text: "Parol almashtirildi. Keyingi kirishda yangisini ishlating." })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onExpired()
      const body = err instanceof ApiError ? (err.body as { msg?: string; message?: string } | null) : null
      const reason = body?.msg ?? body?.message ?? ''
      setMsg({ ok: false, text: /same|different/i.test(reason) ? "Yangi parol eskisidan farq qilishi kerak." : /weak|short|least/i.test(reason) ? 'Parol juda oddiy. Uzunroq va murakkabroq tanlang.' : "Parolni almashtirib bo'lmadi." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Sozlamalar</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold"><KeyRound className="h-4 w-4 text-brand-600" aria-hidden /> Hisob va parol</h2>
        <p className="mb-4 text-sm text-slate-500">Kirgan hisob: <b className="text-slate-800">{email || '...'}</b></p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="pw1">Yangi parol</label>
            <input id="pw1" type="password" autoComplete="new-password" className="h-11 w-full rounded-xl border border-slate-200 px-3" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="pw2">Parolni takrorlang</label>
            <input id="pw2" type="password" autoComplete="new-password" className="h-11 w-full rounded-xl border border-slate-200 px-3" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          {msg && <p className={`text-sm font-semibold ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
          <button disabled={busy} className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? 'Saqlanmoqda...' : 'Parolni almashtirish'}</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-base font-bold"><ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden /> Statistika va maxfiylik</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Statistika cookie'siz va anonim: IP manzil saqlanmaydi, kunlik qaytarib bo'lmaydigan xesh ishlatiladi.</li>
          <li>Brauzerda "Kuzatma" (Do Not Track) yoqilgan bo'lsa, hisoblanmaydi. Siz o'zingiz kirgan brauzerda ham hisoblanmaydi.</li>
          <li>Botlar va /boshqaruv sahifasi hisobga olinmaydi. Ma'lumotlar 180 kundan keyin o'chiriladi.</li>
        </ul>
      </section>
    </div>
  )
}
