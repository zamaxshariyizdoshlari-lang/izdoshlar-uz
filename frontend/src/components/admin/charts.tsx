// Yengil SVG grafiklar (tashqi kutubxonasiz): vaqt qatori, gorizontal ustunlar, donut, soatlik ustunlar.
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

export const nf = new Intl.NumberFormat('ru-RU')

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']
export function shortDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${Number(d)}-${MONTHS[Number(m) - 1]}`
}

/** 1, 2, 5 x 10^k koʻrinishidagi chiroyli yuqori chegara. */
export function niceMax(v: number): number {
  if (v <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= v) return m * pow
  return 10 * pow
}

/** Oldingi davrga nisbatan oʻzgarish (%). */
export function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (!prev && !cur) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><Minus className="h-3 w-3" aria-hidden /> 0%</span>
  if (!prev) return <span className="text-xs font-semibold text-emerald-600">yangi</span>
  const pct = Math.round(((cur - prev) / prev) * 100)
  const up = pct > 0
  const Icon = pct === 0 ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${pct === 0 ? 'text-slate-400' : up ? 'text-emerald-600' : 'text-rose-600'}`} title="Oldingi shu davrga nisbatan">
      <Icon className="h-3.5 w-3.5" aria-hidden /> {Math.abs(pct)}%
    </span>
  )
}

export function KpiCard({ label, value, cur, prev, hint, icon }: { label: string; value: string; cur?: number; prev?: number; hint?: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-sm font-semibold">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {cur !== undefined && prev !== undefined && <Delta cur={cur} prev={prev} />}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty({ text = "Hali ma'lumot yo'q" }: { text?: string }) {
  return <p className="py-6 text-center text-sm text-slate-400">{text}</p>
}

// ---------------- Vaqt qatori ----------------
export interface SeriesPoint {
  date: string
  value: number
}

export function TimeSeries({ data, color = '#c2540a', label }: { data: SeriesPoint[]; color?: string; label: string }) {
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const W = 800
  const H = 260
  const pad = { l: 44, r: 12, t: 12, b: 28 }
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const x = (i: number) => pad.l + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => pad.t + innerH - (v / max) * innerH
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = data.length ? `${line} L${x(data.length - 1).toFixed(1)},${pad.t + innerH} L${x(0).toFixed(1)},${pad.t + innerH} Z` : ''
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const labelIdx = data.length <= 8 ? data.map((_, i) => i) : [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1]

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - pad.l) / innerW) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const h = hover !== null ? data[hover] : null
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-pan-y" role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{nf.format(t)}</text>
          </g>
        ))}
        {area && <path d={area} fill={`url(#${gid})`} />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#94a3b8">
            {shortDate(data[i].date)}
          </text>
        ))}
        {hover !== null && h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke={color} strokeOpacity="0.35" />
            <circle cx={x(hover)} cy={y(h.value)} r="5" fill="#fff" stroke={color} strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}
        >
          {shortDate(h.date)}: {nf.format(h.value)}
        </div>
      )}
    </div>
  )
}

// ---------------- Gorizontal ustunlar roʻyxati ----------------
export function BarList({ rows, format }: { rows: { name: string; value: number; sub?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <Empty />
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name} className="text-sm">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-slate-700" title={r.name}>{r.name}</span>
            <span className="shrink-0 font-bold tabular-nums text-slate-900">
              {format ? format(r.value) : nf.format(r.value)}
              {r.sub && <span className="ml-1.5 font-normal text-slate-400">{r.sub}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ---------------- Donut ----------------
const PALETTE = ['#c2540a', '#1fa89a', '#ffc94a', '#6366f1', '#ec4899', '#94a3b8']

export function Donut({ rows }: { rows: { name: string; value: number }[] }) {
  const total = rows.reduce((a, r) => a + r.value, 0)
  if (!total) return <Empty />
  const R = 42
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label="Taqsimot">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {rows.map((r, i) => {
          const len = (r.value / total) * C
          const el = (
            <circle key={r.name} cx="50" cy="50" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
          )
          offset += len
          return el
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-slate-700">{r.name}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums">{Math.round((r.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------- Soatlik ustunlar ----------------
export function HourBars({ rows }: { rows: { hour: number; views: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.views))
  const total = rows.reduce((a, r) => a + r.views, 0)
  if (!total) return <Empty />
  return (
    <div>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label="Soatlar boʻyicha koʻrishlar">
        {rows.map((r) => (
          <div key={r.hour} className="group relative flex-1">
            <div className="rounded-t bg-brand-500/80 transition group-hover:bg-brand-600" style={{ height: `${Math.max(3, (r.views / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white group-hover:block">
              {String(r.hour).padStart(2, '0')}:00 · {nf.format(r.views)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
    </div>
  )
}
