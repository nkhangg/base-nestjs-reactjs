import { Navigate } from 'react-router-dom'
import { ROUTES } from '@config/routes'

// Admin portal không có self-registration — redirect về login
export function RegisterPage() {
  return <Navigate to={ROUTES.LOGIN} replace />
}
