import { useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShieldCheck, Users, Key, UserCog, Settings, ScrollText, Image, Bell, FileText, BookOpen, BookText, HelpCircle, BarChart2, Building2, Mail } from 'lucide-react'
import { ErrorBoundary } from '@/shared/components/ui/error-boundary'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { ROUTES } from '@config/routes'
import { useCurrentUser, useLogout } from '@modules/auth'
import { useProfile } from '@modules/profile'
import { NotificationBell } from '@modules/notification'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  requireRole?: boolean
  resource?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: ROUTES.ADMIN, label: 'Admins', icon: Users, requireRole: true, resource: 'admin-management' },
      { to: ROUTES.ROLES, label: 'Roles', icon: Key, requireRole: true, resource: 'role-management' },
      { to: ROUTES.USERS, label: 'Users', icon: UserCog, requireRole: true, resource: 'user-management' },
    ],
  },
  {
    label: 'Nội dung học',
    items: [
      { to: ROUTES.DICTIONARY, label: 'Từ điển', icon: BookOpen, requireRole: true, resource: 'dictionary-management' },
      { to: ROUTES.ARTICLES, label: 'Bài đọc', icon: BookText, requireRole: true, resource: 'article-management' },
      { to: ROUTES.QUESTIONS, label: 'Câu hỏi', icon: HelpCircle, requireRole: true, resource: 'question-management' },
      { to: ROUTES.PROGRESS, label: 'Tiến độ', icon: BarChart2, requireRole: true, resource: 'progress-management' },
      { to: ROUTES.ORGANIZATIONS, label: 'Tổ chức', icon: Building2, requireRole: true, resource: 'organization-management' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: ROUTES.CONFIGS, label: 'Configs', icon: Settings, requireRole: true, resource: 'config-management' },
      { to: ROUTES.MEDIA, label: 'Media', icon: Image, requireRole: true, resource: 'media-management' },
      { to: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell, requireRole: true, resource: 'notification-management' },
      { to: ROUTES.AUDIT_LOGS, label: 'Audit Logs', icon: ScrollText, requireRole: true, resource: 'audit-logs' },
      { to: ROUTES.BLOG, label: 'Blog', icon: FileText, requireRole: true, resource: 'blog-management' },
      { to: ROUTES.CONTACTS, label: 'Liên hệ', icon: Mail, requireRole: true, resource: 'contacts' },
    ],
  },
]

export function MainLayout() {
  const { user } = useCurrentUser()
  const { logout } = useLogout()
  const { data: profile } = useProfile()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const displayName = profile?.name || user?.email || 'A'
  const initial = displayName[0].toUpperCase()

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
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.requireRole) return true
              if (!user?.isAdmin) return false
              if (!item.resource || !user.accessibleResources) return true
              return user.accessibleResources.includes(item.resource)
            })
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map(({ to, label, icon: Icon }) => (
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
                </div>
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.PROFILE}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-zinc-800/60"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="avatar"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {profile?.name || user?.email}
                </p>
                <p className="truncate text-[11px] text-zinc-500">
                  {user?.isAdmin ? 'admin' : 'user'}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
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
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-end border-b bg-white px-4">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { void logout() }}
        title="Đăng xuất?"
        description="Bạn có chắc muốn đăng xuất khỏi hệ thống không?"
        confirmLabel="Đăng xuất"
        cancelLabel="Huỷ"
        variant="warning"
      />
    </div>
  )
}
