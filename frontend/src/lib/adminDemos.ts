// Demo-saytlar: zip'ni brauzerda ochib, fayllarni Supabase Storage'ga (demos ombori) yuklash.
// DIQQAT: Supabase HTML fayllarni text/plain qilib beradi, shuning uchun sayt ularni xavfsiz sandbox iframe'da oʻzi koʻrsatadi.
import { unzip } from 'fflate'
import { ApiError, mediaPath, raw, removeObject, uploadCover } from './adminApi'
import { SUPABASE_URL } from './config'

export interface AdminDemo {
  id: number
  slug: string
  title: string
  description: string
  category: string
  kind: 'url' | 'files'
  url: string
  entry: string
  cover: string | null
  published: boolean
  order: number
}

export interface DemoInput {
  title: string
  description: string
  category: string
  kind: 'url' | 'files'
  url: string
  published: boolean
  order: number
  coverFile: File | null
  removeCover: boolean
  zip: Extracted | null
}

export const MIME: Record<string, string> = {
  html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript',
  json: 'application/json', map: 'application/json', txt: 'text/plain', webmanifest: 'application/manifest+json',
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', ico: 'image/x-icon',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
}
const MAX_ZIP = 40 * 1024 * 1024
const MAX_FILES = 300
const MAX_FILE = 25 * 1024 * 1024
const MAX_TOTAL = 60 * 1024 * 1024

const COLS = 'id,slug,title,description,category,kind,url,entry,cover_url,published,sort_order'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDemo = (r: Record<string, any>): AdminDemo => ({
  id: r.id, slug: r.slug, title: r.title, description: r.description, category: r.category, kind: r.kind,
  url: r.url, entry: r.entry, cover: r.cover_url || null, published: r.published, order: r.sort_order,
})

// ---------------- Zip'ni ochish va tekshirish ----------------
export interface Extracted {
  files: { path: string; data: Uint8Array }[]
  entry: string
  warnings: string[]
  totalBytes: number
  name: string
}

/** Xavfsiz nisbiy yoʻl yoki null (katalog, yashirin fayl, "..", __MACOSX). */
export function cleanZipPath(raw: string): string | null {
  const p = raw.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/^\/+/, '')
  if (!p || p.endsWith('/')) return null
  const parts = p.split('/')
  if (parts.some((s) => s === '..' || s === '.' || s === '' || s.startsWith('.') || s === '__MACOSX')) return null
  if (p.length > 300) return null
  return p
}

const extOf = (p: string) => (p.split('.').pop() ?? '').toLowerCase()

/** Faqat ildizdagi HTML'da "/assets/x.js" -> "assets/x.js" (Storage'da sayt ildizi yoʻq). */
export function fixRootAbsolute(html: string): { html: string; count: number } {
  let count = 0
  const out = html.replace(/(\s(?:src|href|poster|action)=["'])\/(?!\/)/gi, (_m, pre: string) => {
    count++
    return pre
  })
  return { html: out, count }
}

export function extractZip(file: File): Promise<Extracted> {
  return new Promise((resolve, reject) => {
    if (!/\.zip$/i.test(file.name)) return reject(new Error('Faqat .zip fayl yuklang.'))
    if (file.size > MAX_ZIP) return reject(new Error('Zip hajmi 40 MB dan oshmasligi kerak.'))
    file.arrayBuffer().then((buf) => {
      unzip(
        new Uint8Array(buf),
        { filter: (f) => f.originalSize <= MAX_FILE && cleanZipPath(f.name) !== null && extOf(f.name) in MIME },
        (err, entries) => {
          if (err) return reject(new Error("Zip faylni ochib bo'lmadi (buzilgan bo'lishi mumkin)."))
          const names = Object.keys(entries)
          // Hammasi bitta papka ichida boʻlsa, shu papkani olib tashlaymiz
          const clean = names.map((n) => cleanZipPath(n)!).filter(Boolean)
          const top = clean[0]?.split('/')[0]
          const strip = clean.length > 0 && clean.every((p) => p.includes('/') && p.split('/')[0] === top)
          const files = names.map((n) => {
            let path = cleanZipPath(n)!
            if (strip) path = path.slice(top!.length + 1)
            return { path, data: entries[n] }
          })
          const warnings: string[] = []
          if (!files.length) return reject(new Error("Zip ichida mos fayl topilmadi (HTML, CSS, JS, rasm, shrift)."))
          if (files.length > MAX_FILES) return reject(new Error(`Fayllar soni ${MAX_FILES} tadan oshmasligi kerak.`))
          const totalBytes = files.reduce((a, f) => a + f.data.length, 0)
          if (totalBytes > MAX_TOTAL) return reject(new Error('Umumiy hajm 60 MB dan oshmasligi kerak.'))

          const htmls = files.filter((f) => ['html', 'htm'].includes(extOf(f.path))).sort((a, b) => a.path.length - b.path.length)
          const entry = (htmls.find((f) => f.path.toLowerCase() === 'index.html') ?? htmls[0])?.path
          if (!entry) return reject(new Error('Zip ichida index.html topilmadi.'))
          if (entry.toLowerCase() !== 'index.html') warnings.push(`index.html yo'q, "${entry}" asosiy sahifa qilindi.`)

          // Ildizdagi HTML'larda "/" bilan boshlanuvchi yoʻllarni tuzatamiz
          const td = new TextDecoder()
          const te = new TextEncoder()
          let fixed = 0
          for (const f of files) {
            if (['html', 'htm'].includes(extOf(f.path)) && !f.path.includes('/')) {
              const r = fixRootAbsolute(td.decode(f.data))
              if (r.count) {
                f.data = te.encode(r.html)
                fixed += r.count
              }
            }
          }
          if (fixed) warnings.push(`${fixed} ta "/" bilan boshlanuvchi yo'l nisbiyga o'zgartirildi.`)
          resolve({ files, entry, warnings, totalBytes, name: file.name })
        },
      )
    }, reject)
  })
}

// ---------------- Ombor bilan ishlash ----------------
const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

async function listAll(token: string, prefix: string): Promise<string[]> {
  const out: string[] = []
  const stack = [prefix]
  while (stack.length) {
    const p = stack.pop()!
    for (let offset = 0; ; offset += 100) {
      const res = await raw('/storage/v1/object/list/demos', {
        method: 'POST', token, body: JSON.stringify({ prefix: p, limit: 100, offset }),
      })
      const items = (await res.json()) as { name: string; id: string | null }[]
      for (const it of items) (it.id === null ? stack : out).push(`${p}/${it.name}`)
      if (items.length < 100) break
    }
  }
  return out
}

export async function clearDemoFiles(token: string, slug: string): Promise<void> {
  const files = await listAll(token, slug)
  for (let i = 0; i < files.length; i += 50) {
    await raw('/storage/v1/object/demos', { method: 'DELETE', token, body: JSON.stringify({ prefixes: files.slice(i, i + 50) }) })
  }
}

async function putFile(token: string, slug: string, path: string, data: Uint8Array) {
  const type = MIME[extOf(path)]
  await raw(`/storage/v1/object/demos/${slug}/${encodePath(path)}`, {
    method: 'POST', token, body: new Blob([data as BlobPart], { type }),
    headers: { 'Content-Type': type, 'x-upsert': 'true', 'cache-control': 'max-age=300' },
  })
}

async function uploadAll(token: string, slug: string, zip: Extracted, onProgress?: (done: number, total: number) => void) {
  let done = 0
  const queue = [...zip.files]
  const worker = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      await putFile(token, slug, f.path, f.data)
      onProgress?.(++done, zip.files.length)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
}

// ---------------- Demolar CRUD ----------------
export async function fetchDemos(token: string): Promise<AdminDemo[]> {
  const rows = await (await raw(`/rest/v1/demos?select=${COLS}&order=sort_order.asc,id.asc`, { token })).json()
  return rows.map(toDemo)
}

export async function saveDemo(token: string, existing: AdminDemo | null, input: DemoInput, onProgress?: (done: number, total: number) => void): Promise<AdminDemo> {
  let cover_url = existing?.cover ?? ''
  let newCover: string | null = null
  if (input.coverFile) {
    const up = await uploadCover(token, input.coverFile)
    cover_url = up.url
    newCover = up.path
  } else if (input.removeCover) {
    cover_url = ''
  }

  const base = {
    title: input.title, description: input.description, category: input.category, kind: input.kind,
    url: input.kind === 'url' ? input.url : '', published: input.published, sort_order: input.order, cover_url,
    ...(input.kind === 'files' && input.zip ? { entry: input.zip.entry } : {}),
  }
  const prefer = { Prefer: 'return=representation' }
  let row: AdminDemo
  try {
    const res = existing
      ? await raw(`/rest/v1/demos?id=eq.${existing.id}&select=${COLS}`, { method: 'PATCH', token, body: JSON.stringify(base), headers: prefer })
      : await raw(`/rest/v1/demos?select=${COLS}`, { method: 'POST', token, body: JSON.stringify(base), headers: prefer })
    const rows = (await res.json()) as Record<string, unknown>[]
    if (!rows.length) throw new ApiError(403)
    row = toDemo(rows[0])
  } catch (err) {
    await removeObject(token, newCover)
    throw err
  }

  try {
    if (input.kind === 'files' && input.zip) {
      if (existing) await clearDemoFiles(token, row.slug) // yangi zip eskisining oʻrniga
      await uploadAll(token, row.slug, input.zip, onProgress)
    }
    if (input.kind === 'url' && existing?.kind === 'files') await clearDemoFiles(token, row.slug)
  } catch (err) {
    // Yangi demo yarim yuklangan boʻlsa, qoldiq qoldirmaymiz
    if (!existing) {
      await clearDemoFiles(token, row.slug).catch(() => {})
      await raw(`/rest/v1/demos?id=eq.${row.id}`, { method: 'DELETE', token }).catch(() => {})
    }
    await removeObject(token, newCover)
    throw err
  }

  if (existing && (input.coverFile || input.removeCover)) await removeObject(token, mediaPath(existing.cover))
  return row
}

export async function setDemoPublished(token: string, id: number, published: boolean): Promise<AdminDemo> {
  const res = await raw(`/rest/v1/demos?id=eq.${id}&select=${COLS}`, {
    method: 'PATCH', token, body: JSON.stringify({ published }), headers: { Prefer: 'return=representation' },
  })
  const rows = (await res.json()) as Record<string, unknown>[]
  if (!rows.length) throw new ApiError(403)
  return toDemo(rows[0])
}

export async function deleteDemo(token: string, demo: AdminDemo): Promise<void> {
  const res = await raw(`/rest/v1/demos?id=eq.${demo.id}&select=id`, { method: 'DELETE', token, headers: { Prefer: 'return=representation' } })
  if (!((await res.json()) as unknown[]).length) throw new ApiError(403)
  await clearDemoFiles(token, demo.slug).catch(() => {})
  await removeObject(token, mediaPath(demo.cover))
}

export const demoPublicUrl = (slug: string, path: string) => `${SUPABASE_URL}/storage/v1/object/public/demos/${slug}/${encodePath(path)}`
