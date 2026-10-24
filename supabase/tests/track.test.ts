// Ishga tushirish: node --test supabase/tests/track.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BOT_RE, cleanPath, parseUA, referrerHost, sanitizeEvents } from '../functions/track/logic.ts'

const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'
const YANDEX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36'
const FIREFOX_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0'

describe('parseUA', () => {
  it('Chrome / Windows / desktop', () => assert.deepEqual(parseUA(CHROME_WIN), { device: 'desktop', browser: 'Chrome', os: 'Windows' }))
  it('Chrome / Android / mobile', () => assert.deepEqual(parseUA(CHROME_ANDROID), { device: 'mobile', browser: 'Chrome', os: 'Android' }))
  it('Safari / iPhone', () => assert.deepEqual(parseUA(SAFARI_IPHONE), { device: 'mobile', browser: 'Safari', os: 'iOS' }))
  it('iPad planshet', () => assert.equal(parseUA(IPAD).device, 'tablet'))
  it('Edge Chrome emas', () => assert.equal(parseUA(EDGE).browser, 'Edge'))
  it('Yandex brauzeri (Oʻzbekistonda keng tarqalgan)', () => assert.equal(parseUA(YANDEX).browser, 'Yandex'))
  it('Firefox / macOS', () => assert.deepEqual(parseUA(FIREFOX_MAC), { device: 'desktop', browser: 'Firefox', os: 'macOS' }))
})

describe('BOT_RE', () => {
  it('botlarni ushlaydi', () => {
    for (const ua of ['Googlebot/2.1', 'Mozilla/5.0 (compatible; bingbot/2.0)', 'Lighthouse', 'HeadlessChrome/120', 'curl/8.0', 'TelegramBot (like TwitterBot)', 'python-requests/2.31']) {
      assert.ok(BOT_RE.test(ua), ua)
    }
  })
  it('oddiy brauzerlarni oʻtkazadi', () => {
    for (const ua of [CHROME_WIN, CHROME_ANDROID, SAFARI_IPHONE, EDGE, YANDEX, FIREFOX_MAC]) assert.ok(!BOT_RE.test(ua), ua)
  })
})

describe('referrerHost', () => {
  const own = ['izdoshlar-uz.netlify.app', 'localhost']
  it('faqat hostni qaytaradi, www ni olib tashlaydi', () => assert.equal(referrerHost('https://www.google.com/search?q=x', own), 'google.com'))
  it('oʻz saytimizdan kelgan ichki oʻtish hisoblanmaydi', () => assert.equal(referrerHost('https://izdoshlar-uz.netlify.app/narxlar', own), ''))
  it('notoʻgʻri qiymat boʻsh', () => {
    for (const v of ['', 'not a url', null, 42, undefined]) assert.equal(referrerHost(v, own), '')
  })
  it('Telegram havolalari', () => assert.equal(referrerHost('https://t.me/somechannel', own), 't.me'))
})

describe('cleanPath', () => {
  it('query va hash olib tashlanadi', () => assert.equal(cleanPath('/narxlar?utm_source=x#top'), '/narxlar'))
  it('oxiridagi slash olib tashlanadi, ildiz qoladi', () => {
    assert.equal(cleanPath('/blog/'), '/blog')
    assert.equal(cleanPath('/'), '/')
  })
  it('boshqaruv sahifalari hisoblanmaydi', () => {
    assert.equal(cleanPath('/boshqaruv'), '')
    assert.equal(cleanPath('/boshqaruv/x'), '')
  })
  it('nisbiy yoki notoʻgʻri yoʻl rad etiladi', () => {
    for (const v of ['narxlar', 'http://evil', '', null, 5]) assert.equal(cleanPath(v), '')
  })
  it('juda uzun yoʻl kesiladi', () => assert.equal(cleanPath('/' + 'a'.repeat(1000)).length, 300))
})

describe('sanitizeEvents', () => {
  const own = ['izdoshlar-uz.netlify.app']
  it('toʻgʻri koʻrish hodisasi', () => {
    const [e] = sanitizeEvents({ events: [{ k: 'view', p: '/narxlar?x=1', r: 'https://google.com/', us: 'tg', um: 'post', uc: 'oktabr', l: 'uz' }] }, own)
    assert.deepEqual(e, { kind: 'view', name: '', path: '/narxlar', referrer: 'google.com', utm_source: 'tg', utm_medium: 'post', utm_campaign: 'oktabr', lang: 'uz', meta: {} })
  })
  it('hodisa nomi va meta (slug)', () => {
    const [e] = sanitizeEvents({ events: [{ k: 'event', n: 'demo_open', p: '/demolar/x', m: { slug: 'maktab-sayti', evil: '<script>' } }] }, own)
    assert.equal(e.name, 'demo_open')
    assert.deepEqual(e.meta, { slug: 'maktab-sayti' })
  })
  it('notoʻgʻri hodisa nomi tashlanadi', () => {
    assert.equal(sanitizeEvents({ events: [{ k: 'event', n: 'DROP TABLE', p: '/' }] }, own).length, 0)
    assert.equal(sanitizeEvents({ events: [{ k: 'event', p: '/' }] }, own).length, 0)
  })
  it('notoʻgʻri meta qiymatlari olib tashlanadi', () => {
    const [e] = sanitizeEvents({ events: [{ k: 'event', n: 'order_submit', p: '/aloqa', m: { slug: 'A B!', kind: 'demo' } }] }, own)
    assert.deepEqual(e.meta, { kind: 'demo' })
  })
  it('UTM belgilari tozalanadi', () => {
    const [e] = sanitizeEvents({ events: [{ k: 'view', p: '/', us: '<b>x</b>; drop' }] }, own)
    assert.ok(!/[<>;]/.test(e.utm_source))
  })
  it('bir soʻrovda eng koʻpi 10 ta hodisa', () => {
    const events = Array.from({ length: 50 }, () => ({ k: 'view', p: '/' }))
    assert.equal(sanitizeEvents({ events }, own).length, 10)
  })
  it('notoʻgʻri kirish xavfsiz', () => {
    for (const bad of [null, 'x', 5, [], {}, { events: 'x' }, { events: [null, 1, 'a'] }]) assert.deepEqual(sanitizeEvents(bad, own), [])
  })
  it('UTM faqat koʻrish hodisasida saqlanadi', () => {
    const [e] = sanitizeEvents({ events: [{ k: 'event', n: 'order_submit', p: '/aloqa', us: 'tg', r: 'https://google.com' }] }, own)
    assert.equal(e.utm_source, '')
    assert.equal(e.referrer, '')
  })
})
