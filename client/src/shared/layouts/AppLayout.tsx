'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  ClipboardList,
  TrendingUp,
  User,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { cn } from '@shared/utils'
import { ROUTES } from '@config/routes'

const navItems = [
  { href: ROUTES.DASHBOARD, label: 'Tổng quan', icon: LayoutDashboard },
  { href: ROUTES.FLASHCARDS, label: 'Thẻ học', icon: BookOpen },
  { href: ROUTES.GRAMMAR, label: 'Ngữ pháp', icon: PenTool },
  { href: ROUTES.MOCK_TEST, label: 'Thi thử', icon: ClipboardList },
  { href: ROUTES.PROGRESS, label: 'Tiến độ', icon: TrendingUp },
]

const bottomItems = [
  { href: ROUTES.PROFILE, label: 'Hồ sơ', icon: User },
  { href: ROUTES.SETTINGS, label: 'Cài đặt', icon: Settings },
  { href: ROUTES.BILLING, label: 'Gói dịch vụ', icon: CreditCard },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href={ROUTES.DASHBOARD} className="text-lg font-bold text-foreground">
            日本語
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-border px-3 py-4">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
