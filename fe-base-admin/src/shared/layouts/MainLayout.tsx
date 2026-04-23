import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShieldCheck, Users, Key } from 'lucide-react'
import { ErrorBoundary } from '@/shared/components/ui/error-boundary'
import { ROUTES } from '@config/routes'
import { useCurrentUser, useLogout } from '@modules/auth'

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.ADMIN, label: 'Admin Management', icon: Users, requireRole: true },
  { to: ROUTES.ROLES, label: 'Role Management', icon: Key, requireRole: true },
]

export function MainLayout() {
  const { user } = useCurrentUser()
  const { logout } = useLogout()

  const initial = user?.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="hidden w-60 shrink-0 flex-col bg-zinc-950 lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
            <ShieldCheck className="size-4 text-zinc-950" />
          </div>
          <span className="text-sm font-semibold text-white">Admin Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Menu
          </p>
          {navItems
            .filter((item) => !item.requireRole || user?.adminRole)
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-zinc-800 font-medium text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </NavLink>
            ))}
        </nav>

        {/* User */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.email}</p>
              <p className="truncate text-[11px] text-zinc-500">{user?.adminRole ?? 'admin'}</p>
            </div>
            <button
              onClick={() => void logout()}
              title="Đăng xuất"
              className="shrink-0 text-zinc-500 transition-colors hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
