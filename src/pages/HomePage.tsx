import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'

export function HomePage() {
  const { t } = useTranslation()
  const { user, signIn, configured } = useAuth()

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="hero-brand">{t('app.name')}</p>
        <h1>{t('app.tagline')}</h1>
        <p className="hero-sub">{t('home.subtitle')}</p>
        {!configured && <p className="banner warn">{t('config.missing')}</p>}
        <div className="hero-cta">
          {user ? (
            <Link className="btn primary" to="/trips">
              {t('home.cta')}
            </Link>
          ) : (
            <button type="button" className="btn primary" onClick={() => void signIn()}>
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true" />
    </section>
  )
}
