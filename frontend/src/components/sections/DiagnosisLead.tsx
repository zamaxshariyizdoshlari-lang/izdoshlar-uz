import { CheckCircle2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '../../lib/analytics'
import { submitOrder } from '../../lib/api'

/** Tahlil natijasidan keyin tezkor aloqa: ism + telefon, qolganini (natija) oʻzimiz toʻldiramiz. */
export function DiagnosisLead({ brief, service, tier, kind }: { brief: string; service: string; tier: string; kind: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [hp, setHp] = useState('')
  const [err, setErr] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const openedAt = useRef(Date.now())

  async function submit(e: FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (name.trim().length < 2) return setErr('Ismingizni kiriting.')
    if (digits.length < 9) return setErr('Telefon raqamni toʻliq kiriting.')
    if (!consent) return setErr('Davom etish uchun maxfiylik siyosatiga rozilik bering.')
    setErr('')
    setStatus('sending')
    const res = await submitOrder({
      kind: 'order', name: name.trim(), phone: phone.replace(/[\s\-()]/g, ''), telegram: '', audience: 'business',
      service_type: service, package: tier, budget_range: '', description: brief, file_url: '', school_name: '',
      student_count: null, current_system: '', source_page: '/tahlil', website: hp, opened_at: openedAt.current, consent,
    })
    if (res.ok) {
      trackEvent('analysis_lead', { kind })
      setStatus('done')
    } else {
      setStatus('idle')
      setErr(res.reason === 'validation' ? Object.values(res.fields)[0] ?? 'Maʼlumotni tekshiring.' : res.reason === 'rate_limit' ? "Juda ko'p urinish. Birozdan keyin qayta urining." : "Yuborib bo'lmadi. Qayta urinib ko'ring.")
    }
  }

  if (status === 'done')
    return (
      <div className="card mt-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-leaf-500" aria-hidden />
        <p className="mt-3 text-xl font-extrabold">Rahmat! Natijangiz bizga yetdi.</p>
        <p className="mt-1 text-ink-700">Bir ish kuni ichida siz bilan bogʻlanamiz.</p>
      </div>
    )

  return (
    <form onSubmit={submit} className="card mt-8 border-2 border-brand-400" aria-label="Natijani yuborish">
      <h3 className="text-xl">Natijani yuboring, biz bogʻlanamiz</h3>
      <p className="mt-1 text-ink-700">Ism va telefon yetarli: tahlil natijangiz bizga avtomatik yetadi. Majburiyat yoʻq.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="lead-name">Ismingiz</label>
          <input id="lead-name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} />
        </div>
        <div>
          <label className="label" htmlFor="lead-phone">Telefon</label>
          <input id="lead-phone" className="field" type="tel" inputMode="tel" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={20} />
        </div>
      </div>
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>Veb-sayt<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label>
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm text-ink-700">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
        <span>Men <Link to="/maxfiylik" className="font-bold text-brand-700 underline">maxfiylik siyosati</Link> bilan tanishdim va shaxsiy maʼlumotlarimni qayta ishlashga rozilik beraman.</span>
      </label>
      {err && <p role="alert" className="mt-3 font-semibold text-red-600">{err}</p>}
      <button type="submit" disabled={status === 'sending'} className="btn btn-primary mt-4 disabled:opacity-60">{status === 'sending' ? 'Yuborilmoqda...' : 'Yuborish'}</button>
    </form>
  )
}
