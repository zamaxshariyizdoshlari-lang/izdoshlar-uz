import { Download, Eye, MousePointerClick, RefreshCw, ShoppingBag, Target, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../lib/adminApi'
import { fetchStats, type Stats } from '../../lib/adminExtra'
import { BarList, Donut, Empty, HourBars, KpiCard, Panel, TimeSeries, nf } from './charts'

const RANGES = [7, 30, 90]
const METRICS = [
  { key: 'visitors', label: 'Tashrif buyuruvchilar', color: '#c2540a' },
  { key: 'views', label: "Ko'rishlar", color: '#1fa89a' },
  { key: 'orders', label: 'Buyurtmalar', color: '#6366f1' },
] as const

const EVENT_LABELS: Record<string, string> = {
  order_submit: 'Buyurtma yuborildi',
  telegram_click: 'Telegram bosildi',
  phone_click: 'Telefon bosildi',
  product_click: 'Mahsulotga qiziqish',
  demo_open: 'Demo ochildi',
  analysis_done: 'Tahlil yakunlandi',
  analysis_order: 'Tahlildan buyurtma bosildi',
}
const STATUS_LABELS: Record<string, string> = { yangi: 'Yangi', muzokara: 'Muzokara', jarayonda: 'Jarayonda', tugadi: 'Tugadi' }
const SERVICE_LABELS: Record<string, string> = {
  website: 'Sayt / veb-ilova', erp: 'Maktab ERP', timetable: 'Dars jadvali', bot: 'Telegram / Instagram bot',
  ai: 'AI agent', content: 'Taqdimot / kontent', other: 'Boshqa',
}
const DEVICE_LABELS: Record<string, string> = { desktop: 'Kompyuter', mobile: 'Telefon', tablet: 'Planshet' }

let regionNames: Intl.DisplayNames | null = null
function country(code: string): string {
  if (!code) return 'Nomaʼlum'
  try {
    regionNames ??= new Intl.DisplayNames(['uz', 'en'], { type: 'region' })
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

function csvDownload(stats: Stats) {
  const rows = [['sana', 'tashrif_buyuruvchilar', 'korishlar', 'buyurtmalar'], ...stats.daily.map((d) => [d.date, d.visitors, d.views, d.orders])]
  const blob = new Blob(['﻿' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `statistika-${stats.days}-kun.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function StatsPage({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [days, setDays] = useState(30)
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('visitors')
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await fetchStats(token, days))
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onExpired()
      else setError(err instanceof ApiError && err.status === 403 ? "Bu hisobda ruxsat yo'q." : "Statistikani yuklab bo'lmadi.")
    } finally {
      setLoading(false)
    }
  }, [token, days, onExpired])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000) // "hozir onlayn" va raqamlar yangilanib turadi
    return () => clearInterval(id)
  }, [load])

  const m = METRICS.find((x) => x.key === metric)!
  const series = useMemo(() => (stats?.daily ?? []).map((d) => ({ date: d.date, value: d[metric] })), [stats, metric])

  const cur = stats?.current
  const prev = stats?.previous
  const conv = cur && cur.visitors ? (cur.orders / cur.visitors) * 100 : 0
  const prevConv = prev && prev.visitors ? (prev.orders / prev.visitors) * 100 : 0
  const empty = !!stats && stats.current.views === 0 && stats.current.orders === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Statistika</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${stats?.live ? 'animate-ping' : 'hidden'}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${stats?.live ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </span>
            Hozir saytda: <b className="text-slate-900">{nf.format(stats?.live ?? 0)}</b> (oxirgi 5 daqiqa)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Davr">
            {RANGES.map((r) => (
              <button key={r} onClick={() => setDays(r)} aria-pressed={days === r} className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${days === r ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {r} kun
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" aria-label="Yangilash">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          </button>
          {stats && (
            <button onClick={() => csvDownload(stats)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" aria-hidden /> CSV
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Tashrif buyuruvchilar" value={nf.format(cur?.visitors ?? 0)} cur={cur?.visitors} prev={prev?.visitors} icon={<Users className="h-4 w-4" aria-hidden />} hint="Kunlik noyob" />
        <KpiCard label="Ko'rishlar" value={nf.format(cur?.views ?? 0)} cur={cur?.views} prev={prev?.views} icon={<Eye className="h-4 w-4" aria-hidden />} hint="Sahifa ko'rishlari" />
        <KpiCard label="Buyurtmalar" value={nf.format(cur?.orders ?? 0)} cur={cur?.orders} prev={prev?.orders} icon={<ShoppingBag className="h-4 w-4" aria-hidden />} />
        <KpiCard label="Konversiya" value={`${conv.toFixed(1)}%`} cur={conv} prev={prevConv} icon={<Target className="h-4 w-4" aria-hidden />} hint="Buyurtma / tashrif" />
        <KpiCard label="Demo ochilishlari" value={nf.format(cur?.demo_opens ?? 0)} cur={cur?.demo_opens} prev={prev?.demo_opens} icon={<MousePointerClick className="h-4 w-4" aria-hidden />} />
      </div>

      {empty && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Bu davrda hali tashrif yo'q. Sayt ochilganda ma'lumotlar shu yerda paydo bo'ladi (anonim, cookie'siz).
        </div>
      )}

      <Panel
        title="Dinamika"
        action={
          <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
            {METRICS.map((x) => (
              <button key={x.key} role="tab" aria-selected={metric === x.key} onClick={() => setMetric(x.key)} className={`rounded-lg px-3 py-1 text-xs font-bold transition sm:text-sm ${metric === x.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {x.label}
              </button>
            ))}
          </div>
        }
      >
        {stats ? <TimeSeries data={series} color={m.color} label={m.label} /> : <Empty text="Yuklanmoqda..." />}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top sahifalar">
          <BarList rows={(stats?.pages ?? []).map((p) => ({ name: p.path, value: p.views, sub: `${nf.format(p.visitors)} kishi` }))} />
        </Panel>
        <Panel title="Qayerdan kelishdi">
          <BarList rows={(stats?.referrers ?? []).map((r) => ({ name: r.name || "To'g'ridan-to'g'ri", value: r.visitors }))} />
        </Panel>
        <Panel title="Qurilmalar">
          <Donut rows={(stats?.devices ?? []).map((d) => ({ name: DEVICE_LABELS[d.name] ?? d.name, value: d.visitors }))} />
        </Panel>
        <Panel title="Soatlar bo'yicha ko'rishlar" className="lg:row-span-1">
          <HourBars rows={stats?.hourly ?? []} />
          <p className="mt-2 text-xs text-slate-400">Toshkent vaqti bilan</p>
        </Panel>
        <Panel title="Brauzerlar">
          <BarList rows={(stats?.browsers ?? []).map((b) => ({ name: b.name, value: b.visitors }))} />
        </Panel>
        <Panel title="Operatsion tizimlar">
          <BarList rows={(stats?.os ?? []).map((b) => ({ name: b.name, value: b.visitors }))} />
        </Panel>
        <Panel title="Davlatlar">
          <BarList rows={(stats?.countries ?? []).map((c) => ({ name: country(c.name), value: c.visitors }))} />
        </Panel>
        <Panel title="Reklama manbalari (UTM)">
          {stats && !stats.utm.length ? (
            <Empty text="UTM belgili havolalar hali yo'q. Masalan: ?utm_source=telegram" />
          ) : (
            <BarList rows={(stats?.utm ?? []).map((u) => ({ name: u.name, value: u.visitors }))} />
          )}
        </Panel>
        <Panel title="Harakatlar">
          <BarList rows={(stats?.events ?? []).map((e) => ({ name: EVENT_LABELS[e.name] ?? e.name, value: e.count }))} />
        </Panel>
        <Panel title="Top demolar">
          <BarList rows={(stats?.demos ?? []).map((d) => ({ name: d.slug, value: d.opens }))} />
        </Panel>
        <Panel title="Buyurtmalar: holat bo'yicha">
          <Donut rows={(stats?.orders_by_status ?? []).map((o) => ({ name: STATUS_LABELS[o.name] ?? o.name, value: o.count }))} />
        </Panel>
        <Panel title="Buyurtmalar: xizmat bo'yicha">
          <BarList rows={(stats?.orders_by_service ?? []).map((o) => ({ name: SERVICE_LABELS[o.name] ?? o.name, value: o.count }))} />
        </Panel>
      </div>
    </div>
  )
}
