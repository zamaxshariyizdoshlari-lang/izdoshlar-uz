// Ishga tushirish: node --test frontend/tests/diagnosis.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { businessTypes, pains, solutions } from '../src/i18n/diagnosis.uz.ts'
import { buildBrief, orderLink, painsFor, recommend } from '../src/lib/diagnosis.ts'

describe('maʼlumotlar yaxlitligi', () => {
  it('har bir muammo mavjud yechimlarga ishora qiladi', () => {
    const ids = new Set(solutions.map((s) => s.id))
    for (const p of pains) for (const s of p.solutions) assert.ok(ids.has(s), `${p.id} -> ${s}`)
  })
  it('har bir muammo mavjud biznes turlariga tegishli', () => {
    const types = new Set(businessTypes.map((t) => t.id))
    for (const p of pains) if (p.types !== 'all') for (const t of p.types) assert.ok(types.has(t), `${p.id} -> ${t}`)
  })
  it('har bir yechim muddati va xizmat turi toʻgʻri', () => {
    const services = ['website', 'erp', 'timetable', 'bot', 'ai', 'content', 'other']
    for (const s of solutions) {
      assert.ok(s.weeks[0] >= 1 && s.weeks[0] <= s.weeks[1], s.id)
      assert.ok(services.includes(s.service), s.id)
    }
  })
  it('har bir biznes turi uchun kamida 5 ta muammo tanlash mumkin', () => {
    for (const t of businessTypes) assert.ok(painsFor(t.id).length >= 5, t.id)
  })
})

describe('painsFor', () => {
  it('maktabga xos muammolar faqat maktabda', () => {
    assert.ok(painsFor('maktab').some((p) => p.id === 'school_attendance'))
    assert.ok(!painsFor('savdo').some((p) => p.id === 'school_attendance'))
    assert.ok(!painsFor('boshqa').some((p) => p.id === 'school_timetable'))
  })
  it('ombor muammosi savdo va ishlab chiqarishda bor, xizmatda yoʻq', () => {
    assert.ok(painsFor('savdo').some((p) => p.id === 'inventory'))
    assert.ok(!painsFor('xizmat').some((p) => p.id === 'inventory'))
  })
})

describe('recommend', () => {
  it('muammodan yechim topadi va sabablarini koʻrsatadi', () => {
    const r = recommend('savdo', ['no_site'], 'solo')
    assert.equal(r.first?.id, 'site_vizitka')
    assert.deepEqual(r.items[0].because.length, 1)
  })
  it('bir nechta muammo bir yechimga ishora qilsa, u yuqoriga chiqadi', () => {
    const r = recommend('xizmat', ['lead_loss', 'no_followup', 'excel_chaos'], 'solo')
    assert.equal(r.items[0].solution.id, 'mini_crm')
    assert.equal(r.items[0].because.length, 3)
  })
  it('natija 5 tadan oshmaydi va tartiblangan', () => {
    const r = recommend('savdo', painsFor('savdo').map((p) => p.id), 'mid')
    assert.ok(r.items.length <= 5)
    for (let i = 1; i < r.items.length; i++) assert.ok(r.items[i - 1].score >= r.items[i].score)
  })
  it('bu tur uchun mos boʻlmagan muammo eʼtiborga olinmaydi', () => {
    const r = recommend('savdo', ['school_attendance'], 'solo')
    assert.equal(r.items.length, 0)
    assert.equal(r.first, null)
  })
  it('paket: kichik jamoa Start, oʻrta Pro, katta Korporativ', () => {
    assert.equal(recommend('savdo', ['no_site'], 'solo').tier, 'start')
    assert.equal(recommend('savdo', ['no_site'], 'mid').tier, 'pro')
    assert.equal(recommend('savdo', ['no_site'], 'large').tier, 'maktab_biznes')
  })
  it('murakkab yechim paketni koʻtaradi (maktab ERP -> Korporativ)', () => {
    assert.equal(recommend('maktab', ['school_attendance'], 'solo').tier, 'maktab_biznes')
  })
  it('maktab vertikali: davomat va jadval', () => {
    const r = recommend('maktab', ['school_attendance', 'school_timetable'], 'mid')
    assert.deepEqual(r.items.map((i) => i.solution.id).sort(), ['school_erp', 'timetable'])
  })
})

describe('buildBrief va orderLink', () => {
  const r = recommend('savdo', ['manual_orders', 'slow_replies'], 'mid')
  it('qisqa matn: tur, muammolar va yechimlar', () => {
    const t = buildBrief('savdo', 'mid', ['manual_orders', 'slow_replies'], r, 'Filiallar bor')
    assert.ok(t.includes('Doʻkon / savdo'))
    assert.ok(t.includes('6–20 kishi'))
    assert.ok(t.includes('Qoʻshimcha: Filiallar bor'))
    assert.ok(t.length <= 1400)
  })
  it('juda uzun izoh kesiladi', () => {
    const t = buildBrief('savdo', 'solo', ['no_site'], recommend('savdo', ['no_site'], 'solo'), 'x'.repeat(5000))
    assert.ok(t.length <= 1400)
  })
  it('buyurtma havolasi xizmat, paket va matnni oʻz ichiga oladi', () => {
    const link = orderLink('savdo', 'mid', ['manual_orders'], r, '')
    const q = new URL('http://x' + link).searchParams
    assert.equal(link.startsWith('/aloqa?'), true)
    assert.equal(q.get('paket'), r.tier)
    assert.ok(['bot', 'website'].includes(q.get('xizmat') ?? ''))
    assert.ok((q.get('tahlil') ?? '').includes('Muammolar:'))
  })
})
