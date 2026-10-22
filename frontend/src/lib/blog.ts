import { marked } from 'marked'

export interface Post {
  slug: string
  title: string
  date: string
  description: string
  html: string
}

export interface ApiPost {
  slug: string
  title: string
  date: string
  description: string
  body: string
}

// Kontent faqat admin yoki repo ichidagi .md fayllardan keladi (oddiy foydalanuvchi kiritmaydi)
export const toPost = (p: ApiPost): Post => ({
  slug: p.slug,
  title: p.title,
  date: p.date,
  description: p.description,
  html: marked.parse(p.body, { async: false }) as string,
})

// ---------- Zaxira: repo ichidagi markdown fayllar ----------
const files = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

function parseFile(path: string, raw: string): Post {
  const slug = path.split('/').pop()!.replace(/\.md$/, '')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  const meta: Record<string, string> = {}
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return toPost({
    slug,
    title: meta.title || slug,
    date: meta.date || '',
    description: meta.description || '',
    body: m ? m[2] : raw,
  })
}

export const localPosts: Post[] = Object.entries(files)
  .map(([p, raw]) => parseFile(p, raw))
  .sort((a, b) => b.date.localeCompare(a.date))

export function formatDate(iso: string) {
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()}-${months[d.getUTCMonth()]}, ${d.getUTCFullYear()}`
}
