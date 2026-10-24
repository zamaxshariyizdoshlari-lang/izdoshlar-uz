// Biznes tahlili mantiqi: sof funksiyalar (tarmoq yoʻq), Node testlarida ham ishlaydi.
import { businessTypes, pains, sizes, solutions, type Pain, type Size, type Solution, type Tier } from '../i18n/diagnosis.uz.ts'

const TIER_ORDER: Tier[] = ['start', 'pro', 'maktab_biznes']

/** Tanlangan biznes turiga mos muammolar. "Boshqa" uchun maktabga xos boʻlmaganlar chiqadi. */
export function painsFor(typeId: string): Pain[] {
  return pains.filter((p) => {
    if (p.types === 'all') return true
    if (typeId === 'boshqa') return !p.types.every((t) => t === 'maktab')
    return p.types.includes(typeId)
  })
}

export interface Recommendation {
  items: { solution: Solution; because: string[]; score: number }[]
  tier: Tier
  first: Solution | null
}

export function recommend(typeId: string, painIds: string[], size: Size): Recommendation {
  const allowed = new Set(painsFor(typeId).map((p) => p.id))
  const chosen = pains.filter((p) => painIds.includes(p.id) && allowed.has(p.id))

  const score = new Map<string, { n: number; because: string[] }>()
  for (const p of chosen) {
    p.solutions.forEach((sid, idx) => {
      const cur = score.get(sid) ?? { n: 0, because: [] }
      // Birinchi (asosiy) yechim ogʻirroq hisoblanadi
      cur.n += idx === 0 ? 2 : 1
      cur.because.push(p.label)
      score.set(sid, cur)
    })
  }

  const items = [...score.entries()]
    .map(([sid, v]) => ({ solution: solutions.find((s) => s.id === sid)!, because: v.because, score: v.n }))
    .filter((x) => x.solution)
    .sort((a, b) => b.score - a.score || a.solution.weeks[1] - b.solution.weeks[1])
    .slice(0, 5)

  const sizeTier: Tier = size === 'large' ? 'maktab_biznes' : size === 'mid' ? 'pro' : 'start'
  const tier = [sizeTier, ...items.map((i) => i.solution.tier)].reduce((a, b) => (TIER_ORDER.indexOf(b) > TIER_ORDER.indexOf(a) ? b : a), 'start' as Tier)

  return { items, tier, first: items[0]?.solution ?? null }
}

/** Buyurtma formasiga oldindan yoziladigan qisqa matn (formada tahrirlash mumkin). */
export function buildBrief(typeId: string, size: Size, painIds: string[], rec: Recommendation, note: string): string {
  const type = businessTypes.find((t) => t.id === typeId)?.label ?? typeId
  const sz = sizes.find((s) => s.id === size)?.label ?? ''
  const lines = [
    `Biznes turi: ${type}${sz ? ` (${sz})` : ''}`,
    'Muammolar:',
    ...pains.filter((p) => painIds.includes(p.id)).map((p) => `- ${p.label}`),
    'Taklif qilingan yechimlar:',
    ...rec.items.slice(0, 3).map((i) => `- ${i.solution.title}`),
  ]
  const cleanNote = note.trim().slice(0, 300)
  if (cleanNote) lines.push(`Qoʻshimcha: ${cleanNote}`)
  return lines.join('\n').slice(0, 1400)
}

export function orderLink(typeId: string, size: Size, painIds: string[], rec: Recommendation, note: string): string {
  const q = new URLSearchParams()
  if (rec.first) q.set('xizmat', rec.first.service)
  q.set('paket', rec.tier)
  q.set('tahlil', buildBrief(typeId, size, painIds, rec, note))
  return `/aloqa?${q.toString()}`
}
