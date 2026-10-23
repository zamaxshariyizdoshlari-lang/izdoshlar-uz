// Ishga tushirish: node --test supabase/tests/   (Node 22.6+/24, qoʻshimcha paket kerak emas)
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { esc, formatTelegram } from '../functions/submit-order/format.ts'
import { validateOrder, type CleanOrder } from '../functions/submit-order/validate.ts'

const VALID = {
  name: 'Ali Valiyev',
  phone: '+998901234567',
  service_type: 'website',
  package: 'pro',
  budget_range: 'mid',
  description: 'Maktabimiz uchun sayt kerak.',
  consent: true,
}

const ok = (raw: unknown, now?: number) => {
  const r = validateOrder(raw, now)
  assert.equal(r.ok, true, JSON.stringify(r))
  return r as Extract<ReturnType<typeof validateOrder>, { ok: true }>
}
const errors = (raw: unknown) => {
  const r = validateOrder(raw)
  assert.equal(r.ok, false)
  return (r as Extract<ReturnType<typeof validateOrder>, { ok: false }>).errors
}

describe('validateOrder', () => {
  it('toʻgʻri buyurtmani qabul qiladi', () => {
    const r = ok(VALID)
    assert.equal(r.value.name, 'Ali Valiyev')
    assert.equal(r.value.audience, 'business')
    assert.equal(r.spam, false)
  })

  it('telefonni normallashtiradi', () => {
    assert.equal(ok({ ...VALID, phone: '+998 90 123-45-67' }).value.phone, '+998901234567')
  })

  it('notoʻgʻri telefonni rad etadi', () => {
    assert.ok(errors({ ...VALID, phone: '12345' }).phone)
  })

  it('telefon yoki Telegramdan biri majburiy', () => {
    const { phone: _p, ...noPhone } = VALID
    assert.ok(errors(noPhone).non_field_errors)
    assert.equal(ok({ ...noPhone, telegram: '@ali_dev' }).value.telegram, '@ali_dev')
  })

  it('notoʻgʻri Telegram username ni rad etadi', () => {
    assert.ok(errors({ ...VALID, telegram: 'a b' }).telegram)
  })

  it('rozilik majburiy (true boʻlishi shart)', () => {
    assert.ok(errors({ ...VALID, consent: undefined }).consent)
    assert.ok(errors({ ...VALID, consent: false }).consent)
    assert.ok(errors({ ...VALID, consent: 'true' }).consent)
  })

  it('buyurtma tavsifi kamida 10 belgi', () => {
    assert.ok(errors({ ...VALID, description: 'qisqa' }).description)
  })

  it('demo uchun maktab nomi majburiy, tavsif shart emas', () => {
    const demo = { ...VALID, kind: 'demo', service_type: 'erp', description: '' }
    assert.ok(errors(demo).school_name)
    const r = ok({ ...demo, school_name: '12-maktab', student_count: '640' })
    assert.equal(r.value.audience, 'school')
    assert.equal(r.value.student_count, 640)
  })

  it('oʻquvchilar soni chegarasi', () => {
    assert.ok(errors({ ...VALID, kind: 'demo', school_name: 'X', student_count: 0 }).student_count)
    assert.ok(errors({ ...VALID, kind: 'demo', school_name: 'X', student_count: 'abc' }).student_count)
  })

  it('fayl havolasi faqat http(s)', () => {
    assert.ok(errors({ ...VALID, file_url: 'javascript:alert(1)' }).file_url)
    assert.equal(ok({ ...VALID, file_url: 'https://drive.google.com/x' }).value.file_url, 'https://drive.google.com/x')
  })

  it('nomaʼlum qiymatlar xavfsiz standartga tushadi (bazaga chiqib ketmaydi)', () => {
    const r = ok({ ...VALID, service_type: 'hack', package: 'x', budget_range: 'y', kind: 'z' })
    assert.deepEqual([r.value.service_type, r.value.package, r.value.budget_range, r.value.kind], ['other', 'custom', 'unknown', 'order'])
  })

  it('juda uzun matnni kesadi', () => {
    assert.equal(ok({ ...VALID, description: 'a'.repeat(5000) }).value.description.length, 3000)
    assert.equal(ok({ ...VALID, name: 'b'.repeat(500) }).value.name.length, 100)
  })

  it('obyekt boʻlmagan kirishni rad etadi', () => {
    for (const bad of [null, 'text', 42, [1, 2]]) assert.ok(errors(bad).non_field_errors)
  })

  it('honeypot toʻldirilsa spam', () => {
    assert.equal(ok({ ...VALID, website: 'http://spam.example' }).spam, true)
  })

  it('juda tez yuborilgan forma spam, sekin yuborilgani emas', () => {
    const now = 1_000_000
    assert.equal(ok({ ...VALID, opened_at: now - 500 }, now).spam, true)
    assert.equal(ok({ ...VALID, opened_at: now - 10_000 }, now).spam, false)
  })
})

describe('formatTelegram', () => {
  const base: CleanOrder = {
    kind: 'order', name: 'Ali <b>', phone: '+998901234567', telegram: '', audience: 'business',
    service_type: 'bot', package: 'pro', budget_range: 'mid', description: 'a & b < c', file_url: '',
    school_name: '', student_count: null, current_system: '', source_page: '',
  }

  it('HTML belgilarini ekranlaydi (Telegram HTML rejimi buzilmasligi uchun)', () => {
    const text = formatTelegram(base)
    assert.ok(text.includes('Ali &lt;b&gt;'))
    assert.ok(text.includes('a &amp; b &lt; c'))
    assert.ok(!text.includes('Ali <b>'))
  })

  it('demo uchun maktab maʼlumotini koʻrsatadi', () => {
    const text = formatTelegram({ ...base, kind: 'demo', school_name: '12-maktab', student_count: 640 })
    assert.ok(text.includes('Demo soʻrovi'))
    assert.ok(text.includes('12-maktab, oʻquvchilar: 640'))
  })

  it('esc()', () => {
    assert.equal(esc('<&>'), '&lt;&amp;&gt;')
  })
})
