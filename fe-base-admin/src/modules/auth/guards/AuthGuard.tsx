import { Navigate, Outlet } from 'react-router-dom'
import { PageLoader } from '@shared/components/ui'
import { ROUTES } from '@config/routes'
import { useCurrentUser } from '../hooks/useAuth'

export function AuthGuard() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  return <Outlet />
}
