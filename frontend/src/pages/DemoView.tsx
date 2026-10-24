import { ArrowLeft, ExternalLink, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useParams, type LoaderFunctionArgs } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { Seo } from '../components/layout/Seo'
import { trackEvent } from '../lib/analytics'
import { getDemo, type Demo } from '../lib/api'
import { SUPABASE_URL } from '../lib/config'
import { DEMO_CATEGORIES } from './Demos'
import { Component as NotFound } from './NotFound'

export const loader = ({ params }: LoaderFunctionArgs) => getDemo(params.slug ?? '')

const DEVICES = [
  { id: 'desktop', label: 'Kompyuter', icon: Monitor, width: '100%' },
  { id: 'tablet', label: 'Planshet', icon: Tablet, width: '768px' },
  { id: 'mobile', label: 'Telefon', icon: Smartphone, width: '390px' },
] as const

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

/** Demo HTML'iga <base> va havolalarni ushlovchi skriptni qoʻshadi (sandbox iframe uchun). */
function buildSrcdoc(html: string, root: string, dir: string): string {
  const base = `<base href="${root}${dir}">`
  const script = `<script>(function(){var ROOT=${JSON.stringify(root).replace(/</g, '\\u003c')};
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;var h=a.getAttribute('href');if(!h||h.charAt(0)==='#'||/^(mailto:|tel:|javascript:)/i.test(h))return;var u;try{u=new URL(h,document.baseURI)}catch(_){return}
if(u.href.indexOf(ROOT)===0&&(/\\.html?$/i.test(u.pathname)||!/\\.[a-z0-9]+$/i.test(u.pathname))){e.preventDefault();parent.postMessage({demoNav:u.href.slice(ROOT.length).split('#')[0].split('?')[0]},'*');return}
if(/^https?:/i.test(u.href)){e.preventDefault();window.open(u.href,'_blank','noopener')}},true);
document.addEventListener('submit',function(e){e.preventDefault()},true);})();<\/script>`
  const withBase = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${base}`) : `${base}${html}`
  return /<\/body>/i.test(withBase) ? withBase.replace(/<\/body>/i, `${script}</body>`) : withBase + script
}

export function Component() {
  const loaded = useLoaderData() as Demo | null
  const { slug = '' } = useParams()
  const [demo, setDemo] = useState<Demo | null>(loaded)
  const [looked, setLooked] = useState(!!loaded || slug === '__fallback')
  const [device, setDevice] = useState<(typeof DEVICES)[number]['id']>('desktop')
  const [srcdoc, setSrcdoc] = useState('')
  const [loadErr, setLoadErr] = useState('')
  const frame = useRef<HTMLIFrameElement>(null)

  // Build'dan keyin qoʻshilgan demolar uchun: sahifa tayyor emas boʻlsa, brauzerda yuklaymiz
  useEffect(() => {
    if (demo || looked) return
    getDemo(slug).then((d) => {
      setDemo(d)
      setLooked(true)
    })
  }, [demo, looked, slug])

  useEffect(() => {
    if (demo) trackEvent('demo_open', { slug: demo.slug })
  }, [demo])

  const root = demo ? `${SUPABASE_URL}/storage/v1/object/public/demos/${demo.slug}/` : ''

  const loadPage = useCallback(
    async (path: string) => {
      if (!demo) return
      setLoadErr('')
      try {
        const res = await fetch(`${root}${encodePath(path)}`)
        if (!res.ok) throw new Error(String(res.status))
        const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : ''
        setSrcdoc(buildSrcdoc(await res.text(), root, encodePath(dir).replace(/%2F/g, '/')))
      } catch {
        setLoadErr("Sahifani yuklab bo'lmadi.")
      }
    },
    [demo, root],
  )

  useEffect(() => {
    if (demo?.kind === 'files') loadPage(demo.entry)
  }, [demo, loadPage])

  // Demo ichidagi havolalar (faqat shu iframe'dan, faqat shu demo fayllariga)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      const rel = (e.data as { demoNav?: unknown } | null)?.demoNav
      if (typeof rel !== 'string' || rel.length > 300 || rel.includes('..') || rel.startsWith('/')) return
      const decoded = decodeURIComponent(rel)
      loadPage(!decoded || decoded.endsWith('/') ? `${decoded}index.html` : decoded)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [loadPage])

  if (!demo) {
    if (looked && slug !== '__fallback') return <NotFound />
    return (
      <section className="section">
        <Head><title>Demo</title><meta name="robots" content="noindex" /></Head>
        <p className="container-page text-center text-ink-500">Yuklanmoqda...</p>
      </section>
    )
  }

  const width = DEVICES.find((d) => d.id === device)!.width
  const brief = encodeURIComponent(`Demo: "${demo.title}" kabi sayt kerak.`)
  return (
    <>
      <Seo title={demo.title} description={demo.description || `${demo.title}: demo sayt`} path={`/demolar/${demo.slug}`} />
      <div className="border-b border-line bg-cream-100">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <Link to="/demolar" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden /> Demolar</Link>
            <h1 className="truncate text-2xl">{demo.title}</h1>
            <p className="text-sm text-ink-500">{DEMO_CATEGORIES[demo.category] ?? demo.category}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-white p-1 shadow-soft" role="group" aria-label="Qurilma">
              {DEVICES.map((d) => (
                <button key={d.id} onClick={() => setDevice(d.id)} aria-pressed={device === d.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition ${device === d.id ? 'bg-brand-600 text-white' : 'text-ink-700'}`}>
                  <d.icon className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">{d.label}</span>
                </button>
              ))}
            </div>
            {demo.kind === 'url' && (
              <a href={demo.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary !min-h-10 !px-4 !py-2"><ExternalLink className="h-4 w-4" aria-hidden /> Yangi oynada</a>
            )}
            <Link to={`/aloqa?xizmat=website&tahlil=${brief}`} className="btn btn-primary !min-h-10 !px-4 !py-2">Shunga oʻxshash buyurtma</Link>
          </div>
        </div>
      </div>

      <section className="bg-slate-100 py-6">
        <div className="container-page">
          {demo.description && <p className="mx-auto mb-4 max-w-3xl text-center text-ink-700">{demo.description}</p>}
          <div className="mx-auto overflow-hidden rounded-2xl border border-line bg-white shadow-lift transition-all duration-300" style={{ width, maxWidth: '100%' }}>
            {demo.kind === 'url' ? (
              <iframe ref={frame} title={demo.title} src={demo.url} className="block h-[75vh] min-h-[520px] w-full" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" referrerPolicy="no-referrer" loading="lazy" />
            ) : loadErr ? (
              <p className="grid h-[40vh] place-items-center text-ink-500" role="alert">{loadErr}</p>
            ) : (
              // Sandbox: allow-same-origin YOʻQ, demo kodi bizning saytimiz maʼlumotlariga kira olmaydi
              <iframe ref={frame} title={demo.title} srcDoc={srcdoc} className="block h-[75vh] min-h-[520px] w-full" sandbox="allow-scripts allow-forms allow-popups" referrerPolicy="no-referrer" />
            )}
          </div>
          <p className="mt-3 text-center text-xs text-ink-500">Bu demo versiya: formalar va toʻlovlar ishlamaydi.</p>
        </div>
      </section>
    </>
  )
}
