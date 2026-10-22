import { Head } from 'vite-react-ssg'
import { ButtonLink } from '../components/ui'
import { t } from '../i18n'

export function Component() {
  return (
    <section className="section">
      <Head>
        <title>{t.common.notFoundTitle}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="container-page text-center">
        <p className="text-7xl font-extrabold text-brand-500">404</p>
        <h1 className="h2 mt-4">{t.common.notFoundTitle}</h1>
        <p className="lead mt-3">{t.common.notFoundText}</p>
        <ButtonLink to="/" className="mt-8">{t.common.toHome}</ButtonLink>
      </div>
    </section>
  )
}
