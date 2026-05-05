import { Skeleton } from './skeleton'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value?: number | string
  isLoading?: boolean
}

export function StatCard({ icon: Icon, label, value, isLoading }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <p className="text-xl font-semibold text-gray-900 leading-none mt-0.5">{value}</p>
        )}
      </div>
    </div>
  )
}
