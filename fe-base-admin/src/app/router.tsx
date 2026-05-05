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
const ForgotPasswordPage = lazy(() =>
  import('@modules/auth/index').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@modules/auth/index').then((m) => ({ default: m.ResetPasswordPage })),
)
const DashboardPage = lazy(() =>
  import('@modules/dashboard/index').then((m) => ({ default: m.DashboardPage })),
)
const AdminPage = lazy(() => import('@modules/admin/index').then((m) => ({ default: m.AdminPage })))
const RolePage = lazy(() => import('@modules/admin/index').then((m) => ({ default: m.RolePage })))
const UserPage = lazy(() => import('@modules/user/index').then((m) => ({ default: m.UserPage })))
const ConfigPage = lazy(() => import('@modules/config/index').then((m) => ({ default: m.ConfigPage })))
const AuditPage = lazy(() => import('@modules/audit/index').then((m) => ({ default: m.AuditPage })))
const MediaPage = lazy(() => import('@modules/media/index').then((m) => ({ default: m.MediaPage })))
const NotificationPage = lazy(() =>
  import('@modules/notification/index').then((m) => ({ default: m.NotificationPage })),
)
const BlogPage = lazy(() => import('@modules/blog/index').then((m) => ({ default: m.BlogPage })))
const BlogPostEditorPage = lazy(() =>
  import('@modules/blog/index').then((m) => ({ default: m.BlogPostEditorPage })),
)
const ProfilePage = lazy(() =>
  import('@modules/profile/index').then((m) => ({ default: m.ProfilePage })),
)

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
      { path: ROUTES.FORGOT_PASSWORD, element: withSuspense(<ForgotPasswordPage />) },
      { path: ROUTES.RESET_PASSWORD, element: withSuspense(<ResetPasswordPage />) },
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
          { path: ROUTES.PROFILE, element: withSuspense(<ProfilePage />) },
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
          { path: ROUTES.USERS, element: withSuspense(<UserPage />) },
          { path: ROUTES.CONFIGS, element: withSuspense(<ConfigPage />) },
          { path: ROUTES.AUDIT_LOGS, element: withSuspense(<AuditPage />) },
          { path: ROUTES.MEDIA, element: withSuspense(<MediaPage />) },
          { path: ROUTES.NOTIFICATIONS, element: withSuspense(<NotificationPage />) },
          { path: ROUTES.BLOG, element: withSuspense(<BlogPage />) },
        ],
      },
      // Full-screen editor pages (no sidebar)
      { path: ROUTES.BLOG_NEW, element: withSuspense(<BlogPostEditorPage />) },
      { path: ROUTES.BLOG_EDIT, element: withSuspense(<BlogPostEditorPage />) },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
])
