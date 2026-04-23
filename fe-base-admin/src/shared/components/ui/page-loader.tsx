import { cn } from '@shared/utils'

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
      <svg
        className="h-8 w-8 animate-spin text-gray-900"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    </div>
  )
}
