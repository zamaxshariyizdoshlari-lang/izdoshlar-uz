// Build'dan keyin: <meta charset> ni <head> boshiga ko'chiradi.
// Prerender uni title/description'dan keyin qoldiradi, HTML spetsifikatsiyasi esa
// uni dastlabki 1024 baytda talab qiladi (Lighthouse "charset" tekshiruvi).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const CHARSET = /<meta charset="UTF-8"\s*\/?>/i

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* htmlFiles(p)
    else if (name.endsWith('.html')) yield p
  }
}

let fixed = 0
for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8')
  const m = html.match(CHARSET)
  if (!m || html.indexOf(m[0]) < 200) continue
  const moved = html.replace(CHARSET, '').replace(/<head>/i, `<head>${m[0]}`)
  writeFileSync(file, moved)
  fixed++
}
console.log(`charset tuzatildi: ${fixed} ta fayl`)
