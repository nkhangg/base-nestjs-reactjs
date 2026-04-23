import { Navigate, Outlet } from 'react-router-dom'
import { PageLoader } from '@shared/components/ui'
import { ROUTES } from '@config/routes'
import { useCurrentUser } from '@modules/auth'

export function AdminGuard() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (!user.adminRole) return <Navigate to={ROUTES.DASHBOARD} replace />

  return <Outlet />
}
