'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@shared/utils'

const navLinks = [
  { href: '/#features', label: 'Tính năng' },
  { href: '/#levels', label: 'Cấp độ' },
  { href: '/#how', label: 'Cách học' },
  { href: '/pricing', label: 'Bảng giá' },
]

const footerLinks = [
  { href: '/#features', label: 'Tính năng' },
  { href: '/pricing', label: 'Bảng giá' },
  { href: '/blog', label: 'Blog' },
  { href: '#', label: 'Về chúng tôi' },
  { href: '#', label: 'Liên hệ' },
]

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-50 bg-paper border-b border-border">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-0 px-8">
          {/* Logo */}
          <Link href="/" className="mr-auto flex items-center gap-2 no-underline">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-ink">
              <span className="font-mono text-[13px] font-medium text-white">日</span>
            </div>
            <span className="text-base font-semibold tracking-[-0.3px] text-ink">Nihongo</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-sm px-3.5 py-1.5 text-[13px] transition-all hover:bg-surface hover:text-ink',
                  pathname === link.href ? 'font-medium text-ink' : 'font-normal text-ink-3',
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-3 flex items-center gap-0">
            <Link
              href="/login"
              className="rounded-sm px-3.5 py-1.5 text-[13px] text-ink-3 transition-all hover:bg-surface hover:text-ink"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="ml-3 rounded-lg bg-ink px-4 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-ink-2"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-paper py-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-sm bg-ink">
              <span className="font-mono text-[13px] font-medium text-white">日</span>
            </div>
            <span className="text-sm font-semibold text-ink">Nihongo</span>
          </Link>

          {/* Links */}
          <div className="flex flex-wrap gap-0">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-sm px-2.5 py-1 text-xs text-ink-4 transition-colors hover:text-ink-3"
              >
                {link.label}
              </a>
            ))}
          </div>

          <span className="text-xs text-ink-4">
            © {new Date().getFullYear()} Nihongo · Học tiếng Nhật thông minh
          </span>
        </div>
      </footer>
    </div>
  )
}
