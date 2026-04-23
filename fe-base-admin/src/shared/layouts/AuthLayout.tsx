import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/shared/components/ui/error-boundary'

export function AuthLayout() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}
