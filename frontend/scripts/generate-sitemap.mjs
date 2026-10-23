// Build'dan keyin dist/sitemap.xml va dist/robots.txt yaratadi.
// Slug'lar API'dan olinadi; API javob bermasa repo ichidagi fayllardan (zaxira).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const site = (process.env.VITE_SITE_URL || 'https://[DOMAIN]').replace(/\/$/, '')
const supaUrl = (process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const supaKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''

async function fromApi(path) {
  if (!supaUrl || !supaKey) return null
  try {
    const res = await fetch(`${supaUrl}/rest/v1/${path}`, {
      headers: { apikey: supaKey, ...(supaKey.startsWith('eyJ') ? { Authorization: `Bearer ${supaKey}` } : {}) },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    if (process.env.VITE_REQUIRE_API === '1') throw err
    console.warn(`sitemap: ${path} API'dan olinmadi (${err.message}), zaxira ishlatildi`)
    return null
  }
}

const business = process.env.VITE_ENABLE_BUSINESS === '1'
const pages = ['', '/maktablar', '/loyihalar', '/xizmatlar', ...(business ? ['/narxlar'] : []), '/mahsulotlar', '/haqimda', '/blog', '/aloqa', '/maxfiylik', '/oferta']
const lastmod = {}

const projects = (await fromApi('projects?select=slug&published=eq.true')) ?? JSON.parse(readFileSync(join(root, 'src/data/projects.json'), 'utf8'))
projects.forEach((p) => pages.push(`/loyihalar/${p.slug}`))

let posts = await fromApi('posts?select=slug,date&published=eq.true')
if (!posts) {
  const dir = join(root, 'src/content/blog')
  posts = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ slug: f.replace(/\.md$/, ''), date: readFileSync(join(dir, f), 'utf8').match(/^date:\s*(\S+)/m)?.[1] }))
}
for (const p of posts) {
  pages.push(`/blog/${p.slug}`)
  if (p.date) lastmod[`/blog/${p.slug}`] = p.date
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site}${p}</loc>${lastmod[p] ? `<lastmod>${lastmod[p]}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`
writeFileSync(join(root, 'dist/sitemap.xml'), xml)
writeFileSync(join(root, 'dist/robots.txt'), `User-agent: *\n${process.env.VITE_NOINDEX === '1' ? 'Disallow: /' : 'Allow: /\nDisallow: /boshqaruv'}\n\nSitemap: ${site}/sitemap.xml\n`)
console.log(`sitemap.xml: ${pages.length} ta sahifa`)
