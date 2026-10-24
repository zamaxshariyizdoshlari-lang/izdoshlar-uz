import assert from 'node:assert/strict'
import { test } from 'node:test'
import { type Ctx, type Session, emptySession, handle, normalizePhone, ownerText } from '../functions/telegram-bot/logic.ts'

const ctx: Ctx = {
  packages: [{ name: 'Start', tagline: 'Boshlash uchun', price_text: '3 000 000 soʻmdan', features: ['Sayt', 'Bot <b>', 'Forma', 'SEO', 'Besh'] }],
  demos: [{ slug: 'laptop-market-uz', title: 'Laptop-market.uz', category: 'sayt' }],
  siteUrl: 'https://example.test',
  contactTelegram: '@owner',
  contactPhone: '+998 90 000 00 00',
}

const run = (s: Session, text?: string, callback?: string, username?: string) => handle(s, { text, callback, username }, ctx)

test('normalizePhone', () => {
  assert.equal(normalizePhone('+998 90 123 45 67'), '+998901234567')
  assert.equal(normalizePhone('90 123-45-67'), '+998901234567')
  assert.equal(normalizePhone('998901234567'), '+998901234567')
  assert.equal(normalizePhone('12345'), null)
  assert.equal(normalizePhone('+1 202 555 0147'), null)
})

test('/start menyu koʻrsatadi va holatni tozalaydi', () => {
  const r = run({ step: 'name', data: {} }, '/start')
  assert.equal(r.session.step, null)
  assert.match(r.outs[0].text, /xush kelibsiz/)
  assert.ok(r.outs[0].keyboard?.flat().some((b) => b.data === 'order'))
})

test('narxlar: HTML belgilar tozalanadi, 4 tadan koʻp imkoniyat kesiladi', () => {
  const r = run(emptySession(), undefined, 'prices')
  assert.match(r.outs[0].text, /Start/)
  assert.ok(r.outs[0].text.includes('Bot &lt;b&gt;'))
  assert.ok(!r.outs[0].text.includes('Besh'))
})

test('loyihalar: sayt havolalari', () => {
  const r = run(emptySession(), undefined, 'projects')
  const urls = r.outs[0].keyboard?.flat().map((b) => b.url).filter(Boolean)
  assert.ok(urls?.includes('https://example.test/demolar/laptop-market-uz'))
})

test('buyurtma oqimi: rozilik -> ism -> telefon -> tavsif', () => {
  let s = emptySession()
  let r = run(s, undefined, 'order')
  assert.equal(r.session.step, 'consent')
  assert.match(r.outs[0].text, /maxfiylik/)
  r = run(r.session, undefined, 'consent_yes')
  assert.equal(r.session.step, 'name')
  r = run(r.session, 'Ali Valiyev')
  assert.equal(r.session.step, 'phone')
  r = run(r.session, '123')
  assert.equal(r.session.step, 'phone') // notoʻgʻri raqam: shu qadamda qoladi
  r = run(r.session, '90 123 45 67')
  assert.equal(r.session.step, 'desc')
  r = run(r.session, 'qisqa')
  assert.equal(r.session.step, 'desc')
  r = run(r.session, "Do'kon uchun Telegram bot kerak", undefined, 'ali_v')
  assert.equal(r.session.step, null)
  assert.deepEqual(r.order, { name: 'Ali Valiyev', phone: '+998901234567', telegram: '@ali_v', description: "Do'kon uchun Telegram bot kerak" })
  s = r.session
  assert.equal(s.step, null)
})

test('rozilik bermasdan ism yozish buyurtma yaratmaydi', () => {
  const r = run({ step: 'consent', data: {} }, 'Ali')
  assert.equal(r.session.step, 'consent')
  assert.equal(r.order, undefined)
})

test('bekor qilish holatni tozalaydi', () => {
  const r = run({ step: 'phone', data: { name: 'Ali' } }, undefined, 'cancel')
  assert.equal(r.session.step, null)
  assert.equal(r.order, undefined)
})

test('/ bilan boshlanuvchi matn ism sifatida qabul qilinmaydi', () => {
  const r = run({ step: 'name', data: {} }, '/admin')
  assert.equal(r.session.step, 'name')
})

test('egasiga xabar HTML xavfsiz', () => {
  const t = ownerText({ name: '<i>x</i>', phone: '+998901234567', telegram: '', description: 'a & b' })
  assert.ok(t.includes('&lt;i&gt;x&lt;/i&gt;'))
  assert.ok(t.includes('a &amp; b'))
})

test('begona matn menyuga qaytaradi', () => {
  const r = run(emptySession(), 'salom')
  assert.equal(r.session.step, null)
  assert.ok(r.outs[0].keyboard)
})
