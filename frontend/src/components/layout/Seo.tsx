import { Head } from 'vite-react-ssg'
import { t } from '../../i18n'
import { BRAND_NAME, ENABLE_BUSINESS, SITE_URL } from '../../lib/config'

interface SeoProps {
  title?: string
  description?: string
  path: string
  type?: 'website' | 'article'
  jsonLd?: object
}

export function Seo({ title, description = ENABLE_BUSINESS ? t.seo.defaultDescription : t.seo.defaultDescriptionSchools, path, type = 'website', jsonLd }: SeoProps) {
  const fullTitle = title ? `${title} | ${BRAND_NAME}` : `${BRAND_NAME}: ${(ENABLE_BUSINESS ? t.home.hero : t.home.heroSchools).badge}`
  const url = `${SITE_URL}${path}`
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="uz_UZ" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta name="twitter:card" content="summary" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Head>
  )
}
