import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { t } from '../../i18n'
import { submitOrder, type OrderPayload } from '../../lib/api'
import { ENABLE_BUSINESS } from '../../lib/config'
import { QuickContact } from './QuickContact'

const c = t.contact
const SCHOOL_SERVICES = ['erp', 'timetable', 'ai', 'content', 'other']
const serviceOptions: Record<string, string> = ENABLE_BUSINESS
  ? c.serviceOptions
  : Object.fromEntries(Object.entries(c.serviceOptions).filter(([k]) => SCHOOL_SERVICES.includes(k)))
const PHONE_RE = /^\+998\d{9}$/
const TG_RE = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/

type FormState = {
  kind: 'order' | 'demo'
  name: string
  phone: string
  telegram: string
  service_type: string
  package: string
  budget_range: string
  description: string
  file_url: string
  school_name: string
  student_count: string
  current_system: string
  website: string
  consent: boolean
}

const initial: FormState = {
  kind: ENABLE_BUSINESS ? 'order' : 'demo',
  name: '',
  phone: '',
  telegram: '',
  service_type: ENABLE_BUSINESS ? 'website' : 'erp',
  package: 'custom',
  budget_range: 'unknown',
  description: '',
  file_url: '',
  school_name: '',
  student_count: '',
  current_system: '',
  website: '',
  consent: false,
}

function Select({ id, value, onChange, options }: { id: string; value: string; onChange: (v: string) => void; options: Record<string, string> }) {
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  )
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [formError, setFormError] = useState('')
  const openedAt = useRef(0)
  const { search, pathname } = useLocation()

  // Forma ochilgan vaqt (bot himoyasi) va havoladan oldindan tanlash
  useEffect(() => {
    openedAt.current = Date.now()
    const q = new URLSearchParams(search)
    setForm((f) => ({
      ...f,
      kind: q.get('tur') === 'demo' ? 'demo' : f.kind,
      service_type: q.get('tur') === 'demo' ? 'erp' : q.get('xizmat') && q.get('xizmat')! in serviceOptions ? q.get('xizmat')! : f.service_type,
      package: q.get('paket') && q.get('paket')! in c.packageOptions ? q.get('paket')! : f.package,
    }))
  }, [search])

  const set = (key: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }))
  const isDemo = form.kind === 'demo'

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    const phone = form.phone.replace(/[\s\-()]/g, '')
    if (form.name.trim().length < 2) e.name = c.errNameRequired
    if (!phone && !form.telegram.trim()) e.phone = c.errContactRequired
    else if (phone && !PHONE_RE.test(phone)) e.phone = c.errPhone
    if (form.telegram.trim() && !TG_RE.test(form.telegram.trim())) e.telegram = c.errTelegram
    if (isDemo && !form.school_name.trim()) e.school_name = c.errSchool
    if (!isDemo && form.description.trim().length < 10) e.description = c.errDescription
    if (form.file_url.trim() && !/^https?:\/\//i.test(form.file_url.trim())) e.file_url = c.errUrl
    if (!form.consent) e.consent = c.errConsent
    return e
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setFormError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus()
      return
    }
    setStatus('sending')
    const payload: OrderPayload = {
      kind: form.kind,
      name: form.name.trim(),
      phone: form.phone.replace(/[\s\-()]/g, ''),
      telegram: form.telegram.trim(),
      audience: isDemo ? 'school' : 'business',
      service_type: form.service_type,
      package: form.package,
      budget_range: form.budget_range,
      description: form.description.trim(),
      file_url: form.file_url.trim(),
      school_name: form.school_name.trim(),
      student_count: form.student_count ? Number(form.student_count) : null,
      current_system: form.current_system.trim(),
      source_page: pathname + search,
      website: form.website,
      opened_at: openedAt.current,
      consent: form.consent,
    }
    const res = await submitOrder(payload)
    if (res.ok) {
      setStatus('done')
      return
    }
    setStatus('idle')
    if (res.reason === 'validation') setErrors(res.fields)
    else setFormError(res.reason === 'rate_limit' ? c.errorTooMany : res.reason === 'network' ? c.errorNetwork : c.errorGeneric)
  }

  if (status === 'done') {
    return (
      <div className="card text-center" role="status">
        <CheckCircle2 className="mx-auto h-14 w-14 text-leaf-500" aria-hidden />
        <h2 className="mt-4 text-2xl">{c.successTitle}</h2>
        <p className="lead mt-2">{c.successText}</p>
        <p className="mt-4 text-ink-700">{t.quick.afterSend}</p>
        <QuickContact size="sm" className="mt-3 justify-center" />
        <button
          className="btn btn-secondary mt-6"
          onClick={() => {
            setForm(initial)
            setStatus('idle')
            openedAt.current = Date.now()
          }}
        >
          {c.another}
        </button>
      </div>
    )
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`e-${k}`} className="mt-1 text-sm font-semibold text-red-600" role="alert">
        {errors[k]}
      </p>
    ) : null
  const inv = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `e-${k}` : undefined })

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-cream-100 p-1" role="group" aria-label="Soʻrov turi">
        {(['order', 'demo'] as const).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => set('kind')(k)}
            aria-pressed={form.kind === k}
            className={`rounded-full px-3 py-2.5 text-sm font-bold transition ${form.kind === k ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-700'}`}
          >
            {k === 'order' ? c.kindOrder : c.kindDemo}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="f-name">{c.name} *</label>
        <input id="f-name" className={`field ${errors.name ? 'field-error' : ''}`} value={form.name} onChange={(e) => set('name')(e.target.value)} autoComplete="name" maxLength={100} {...inv('name')} />
        {err('name')}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="f-phone">{c.phone}</label>
          <input id="f-phone" type="tel" inputMode="tel" className={`field ${errors.phone ? 'field-error' : ''}`} placeholder={c.phonePlaceholder} value={form.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" {...inv('phone')} />
          {err('phone')}
        </div>
        <div>
          <label className="label" htmlFor="f-telegram">{c.telegram}</label>
          <input id="f-telegram" className={`field ${errors.telegram ? 'field-error' : ''}`} placeholder="@username" value={form.telegram} onChange={(e) => set('telegram')(e.target.value)} {...inv('telegram')} />
          {err('telegram')}
        </div>
      </div>
      <p className="-mt-3 text-sm text-ink-500">{c.contactHint}</p>

      {isDemo ? (
        <>
          <div>
            <label className="label" htmlFor="f-school_name">{c.schoolName} *</label>
            <input id="f-school_name" className={`field ${errors.school_name ? 'field-error' : ''}`} value={form.school_name} onChange={(e) => set('school_name')(e.target.value)} maxLength={150} {...inv('school_name')} />
            {err('school_name')}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="f-student_count">{c.studentCount}</label>
              <input id="f-student_count" type="number" min={1} max={100000} inputMode="numeric" className="field" value={form.student_count} onChange={(e) => set('student_count')(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="f-current_system">{c.currentSystem}</label>
              <input id="f-current_system" className="field" value={form.current_system} onChange={(e) => set('current_system')(e.target.value)} maxLength={150} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="f-description">{c.description}</label>
            <textarea id="f-description" rows={3} className="field" value={form.description} onChange={(e) => set('description')(e.target.value)} maxLength={3000} />
          </div>
        </>
      ) : (
        <>
          <div className={`grid gap-5 ${ENABLE_BUSINESS ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div>
              <label className="label" htmlFor="f-service_type">{c.serviceType}</label>
              <Select id="f-service_type" value={form.service_type} onChange={set('service_type')} options={serviceOptions} />
            </div>
            {ENABLE_BUSINESS && (
              <div>
                <label className="label" htmlFor="f-package">{c.package}</label>
                <Select id="f-package" value={form.package} onChange={set('package')} options={c.packageOptions} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="f-budget_range">{c.budget}</label>
              <Select id="f-budget_range" value={form.budget_range} onChange={set('budget_range')} options={c.budgetOptions} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="f-description">{c.description} *</label>
            <textarea id="f-description" rows={5} className={`field ${errors.description ? 'field-error' : ''}`} placeholder={c.descriptionPlaceholder} value={form.description} onChange={(e) => set('description')(e.target.value)} maxLength={3000} {...inv('description')} />
            {err('description')}
          </div>
          <div>
            <label className="label" htmlFor="f-file_url">{c.fileUrl}</label>
            <input id="f-file_url" type="url" inputMode="url" className={`field ${errors.file_url ? 'field-error' : ''}`} placeholder="https://" value={form.file_url} onChange={(e) => set('file_url')(e.target.value)} {...inv('file_url')} />
            <p className="mt-1 text-sm text-ink-500">{c.fileUrlHint}</p>
            {err('file_url')}
          </div>
        </>
      )}

      <div>
        <label className="flex items-start gap-3 text-sm text-ink-700">
          <input
            id="f-consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-1 h-5 w-5 shrink-0 accent-brand-600"
            {...inv('consent')}
          />
          <span>
            {c.consentPre}
            <Link to="/maxfiylik" target="_blank" className="font-bold text-brand-700 underline">
              {c.consentLink}
            </Link>
            {c.consentPost}
          </span>
        </label>
        {err('consent')}
      </div>

      {/* Honeypot: odamga koʻrinmaydi, botlar toʻldiradi */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="f-website">Veb-sayt</label>
        <input id="f-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website')(e.target.value)} />
      </div>

      {(errors.non_field_errors || errors.detail) && (
        <p className="font-semibold text-red-600" role="alert">{errors.non_field_errors || errors.detail}</p>
      )}
      {formError && <p className="font-semibold text-red-600" role="alert">{formError}</p>}

      <button className="btn btn-primary w-full" disabled={status === 'sending'}>
        {status === 'sending' ? c.sending : c.submit}
      </button>
    </form>
  )
}
