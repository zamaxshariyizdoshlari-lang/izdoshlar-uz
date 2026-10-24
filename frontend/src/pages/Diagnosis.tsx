import { ArrowLeft, ArrowRight, CheckCircle2, Clock, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/layout/Seo'
import { PageHeader } from '../components/ui'
import { businessTypes, sizes, ui, type Size } from '../i18n/diagnosis.uz'
import { trackEvent } from '../lib/analytics'
import { ENABLE_BUSINESS } from '../lib/config'
import { buildBrief, orderLink, painsFor, recommend } from '../lib/diagnosis'
import { DiagnosisLead } from '../components/sections/DiagnosisLead'

type Step = 1 | 2 | 3 | 'result'

function Choice({ checked, onChange, type, name, title, hint }: { checked: boolean; onChange: () => void; type: 'radio' | 'checkbox'; name: string; title: string; hint?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-white p-4 transition hover:border-brand-400 ${checked ? 'border-brand-600 bg-brand-50' : 'border-line'}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-1 h-5 w-5 shrink-0 accent-brand-600" />
      <span>
        <span className="block font-bold">{title}</span>
        {hint && <span className="block text-sm text-ink-500">{hint}</span>}
      </span>
    </label>
  )
}

export function Component() {
  const [step, setStep] = useState<Step>(1)
  const [typeId, setTypeId] = useState('')
  const [painIds, setPainIds] = useState<string[]>([])
  const [size, setSize] = useState<Size>('solo')
  const [note, setNote] = useState('')

  const available = useMemo(() => (typeId ? painsFor(typeId) : []), [typeId])
  const rec = useMemo(() => recommend(typeId, painIds, size), [typeId, painIds, size])

  useEffect(() => {
    if (step === 'result' && typeId) trackEvent('analysis_done', { kind: typeId })
    if (step !== 1) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, typeId])

  const pickType = (id: string) => {
    if (id !== typeId) setPainIds([]) // boshqa tur: oldingi tanlov mos kelmasligi mumkin
    setTypeId(id)
  }
  const togglePain = (id: string) => setPainIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const restart = () => {
    setStep(1)
    setTypeId('')
    setPainIds([])
    setNote('')
    setSize('solo')
  }

  const progress = step === 'result' ? 100 : (Number(step) / 3) * 100

  return (
    <>
      <Seo title={ui.seoTitle} description={ui.seoDescription} path="/tahlil" />
      <PageHeader title={ui.title} subtitle={ui.subtitle} />

      <section className="section">
        <div className="container-page max-w-3xl">
          {step !== 'result' && (
            <div className="mb-6" aria-live="polite">
              <p className="mb-2 text-sm font-bold text-ink-500">{ui.step} {step} {ui.of} 3</p>
              <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="mb-4 text-2xl font-extrabold">{ui.s1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {businessTypes.map((t) => (
                  <Choice key={t.id} type="radio" name="biz" checked={typeId === t.id} onChange={() => pickType(t.id)} title={t.label} hint={t.hint} />
                ))}
              </div>
              <div className="mt-6 flex items-center gap-4">
                <button className="btn btn-primary" disabled={!typeId} onClick={() => setStep(2)}>{ui.next} <ArrowRight className="h-4 w-4" aria-hidden /></button>
                {!typeId && <span className="text-sm text-ink-500">{ui.pickOne}</span>}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="mb-4 text-2xl font-extrabold">{ui.s2}</legend>
              <div className="space-y-3">
                {available.map((p) => (
                  <Choice key={p.id} type="checkbox" name="pain" checked={painIds.includes(p.id)} onChange={() => togglePain(p.id)} title={p.label} />
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" aria-hidden /> {ui.back}</button>
                <button className="btn btn-primary" disabled={!painIds.length} onClick={() => setStep(3)}>{ui.next} <ArrowRight className="h-4 w-4" aria-hidden /></button>
                {!painIds.length && <span className="text-sm text-ink-500">{ui.pickPain}</span>}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <div>
              <fieldset>
                <legend className="mb-4 text-2xl font-extrabold">{ui.s3}</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {sizes.map((s) => (
                    <Choice key={s.id} type="radio" name="size" checked={size === s.id} onChange={() => setSize(s.id)} title={s.label} hint={s.hint} />
                  ))}
                </div>
              </fieldset>
              <div className="mt-6">
                <label className="label" htmlFor="note">{ui.noteLabel}</label>
                <textarea id="note" rows={3} maxLength={300} className="field" placeholder={ui.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" aria-hidden /> {ui.back}</button>
                <button className="btn btn-primary" onClick={() => setStep('result')}><Sparkles className="h-4 w-4" aria-hidden /> {ui.seeResult}</button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div>
              <h2 className="text-3xl font-extrabold">{ui.resultTitle}</h2>
              <p className="lead mt-2">{ui.resultIntro}</p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-leaf-50 px-4 py-2 font-bold text-leaf-600">
                {ui.recommendedPackage}: {ui.packageNames[rec.tier]}
              </div>

              <ol className="mt-6 space-y-5">
                {rec.items.map(({ solution: s, because }, i) => (
                  <li key={s.id} className={`card ${i === 0 ? 'border-2 border-brand-400' : ''}`}>
                    {i === 0 && <span className="badge mb-3">{ui.firstStage}</span>}
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun-400 font-extrabold text-ink-900">{i + 1}</span>
                      <div className="min-w-0">
                        <h3 className="text-xl">{s.title}</h3>
                        <p className="mt-1 text-ink-700">{s.summary}</p>
                        <ul className="mt-3 space-y-1.5">
                          {s.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-ink-700">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-leaf-500" aria-hidden /> {f}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-sm text-ink-500">
                          <b>{ui.because}:</b> {because.join('; ')}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                          <Clock className="h-4 w-4" aria-hidden /> {ui.weeks}: {s.weeks[0] === s.weeks[1] ? s.weeks[0] : `${s.weeks[0]}–${s.weeks[1]}`} {ui.weekShort}
                        </p>
                        {s.note && <p className="mt-1 text-sm text-ink-500">{s.note}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <DiagnosisLead brief={buildBrief(typeId, size, painIds, rec, note)} service={rec.first?.service ?? 'other'} tier={rec.tier} kind={typeId} />

              <div className="card mt-8 text-center">
                <p className="text-lg font-bold">{ui.orderHint}</p>
                <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to={orderLink(typeId, size, painIds, rec, note)} className="btn btn-primary" onClick={() => trackEvent('analysis_order', { kind: typeId })}>
                    {ui.order} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  {ENABLE_BUSINESS && <Link to="/narxlar" className="btn btn-secondary">{ui.seePricing}</Link>}
                  <button className="btn btn-ghost" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden /> {ui.restart}</button>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-500">{ui.disclaimer}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
