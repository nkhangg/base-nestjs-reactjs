'use client'

import { cn } from '@shared/utils'
import { Spinner } from './spinner'

interface PageLoaderProps {
  className?: string
  fullPage?: boolean
}

export function PageLoader({ className, fullPage = true }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullPage && 'min-h-screen',
        className,
      )}
      role="status"
      aria-label="Đang tải..."
    >
      <Spinner className="size-8 text-zinc-400" />
    </div>
  )
}
