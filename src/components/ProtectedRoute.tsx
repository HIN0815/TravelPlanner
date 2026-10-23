import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth()
  const { t } = useTranslation()

  if (loading) return <p>{t('app.loading')}</p>
  if (!configured) return <p className="banner warn">{t('config.missing')}</p>
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}
