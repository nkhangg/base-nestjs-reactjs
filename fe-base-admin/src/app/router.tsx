import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { MainLayout } from '@shared/layouts/MainLayout'
import { AuthLayout } from '@shared/layouts/AuthLayout'
import { PageLoader } from '@/shared/components/ui/page-loader'
import { ROUTES } from '@config/routes'

// ── Lazy imports (each module exports its pages via index.ts) ──────────────
const LoginPage = lazy(() => import('@modules/auth/index').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() =>
  import('@modules/auth/index').then((m) => ({ default: m.RegisterPage })),
)
const DashboardPage = lazy(() =>
  import('@modules/dashboard/index').then((m) => ({ default: m.DashboardPage })),
)
const AdminPage = lazy(() => import('@modules/admin/index').then((m) => ({ default: m.AdminPage })))
const RolePage = lazy(() => import('@modules/admin/index').then((m) => ({ default: m.RolePage })))

// ── Guards (provided by each module) ──────────────────────────────────────
const AuthGuard = lazy(() => import('@modules/auth/index').then((m) => ({ default: m.AuthGuard })))
const AdminGuard = lazy(() =>
  import('@modules/admin/index').then((m) => ({ default: m.AdminGuard })),
)

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  // ── Public: Auth ──────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: withSuspense(<LoginPage />) },
      { path: ROUTES.REGISTER, element: withSuspense(<RegisterPage />) },
    ],
  },

  // ── Protected: App ────────────────────────────────────────────────────
  {
    element: withSuspense(<AuthGuard />),
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
          { path: ROUTES.DASHBOARD, element: withSuspense(<DashboardPage />) },
        ],
      },
    ],
  },

  // ── Protected: Admin ──────────────────────────────────────────────────
  {
    element: withSuspense(<AdminGuard />),
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: ROUTES.ADMIN, element: withSuspense(<AdminPage />) },
          { path: ROUTES.ROLES, element: withSuspense(<RolePage />) },
        ],
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])
