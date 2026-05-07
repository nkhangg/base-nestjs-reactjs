'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { ROUTES } from '@config/routes'

export function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-medium text-muted-foreground">Buổi học</span>
        <Link
          href={ROUTES.DASHBOARD}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
