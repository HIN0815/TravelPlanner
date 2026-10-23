import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import type { LocaleCode } from '../types/models'

export function Layout() {
  const { t, i18n } = useTranslation()
  const { user, signIn, signOut, setLocale } = useAuth()
  const locale = (i18n.language === 'en' ? 'en' : 'zh-HK') as LocaleCode


  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          {t('app.name')}
        </Link>
        <nav className="nav-links">
          {user && (
            <>
              <NavLink to="/trips">{t('nav.trips')}</NavLink>
              <NavLink to="/wishlist">{t('nav.wishlist')}</NavLink>
            </>
          )}
        </nav>
        <div className="topbar-actions">
          <label className="lang-select">
            <span className="sr-only">{t('nav.language')}</span>
            <select
              value={locale === 'en' ? 'en' : 'zh-HK'}
              onChange={(e) => void setLocale(e.target.value as LocaleCode)}
            >
              <option value="zh-HK">繁中</option>
              <option value="en">EN</option>
            </select>
          </label>
          {user ? (
            <button type="button" className="btn ghost" onClick={() => void signOut()}>
              {t('nav.signOut')}
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => void signIn()}>
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
