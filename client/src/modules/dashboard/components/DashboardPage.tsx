'use client'

import { BookOpen, Flame, Star, Target, Zap } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboard'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Tiến độ học tập của bạn</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Chuỗi ngày"
          value={stats?.streak ?? 0}
          icon={Flame}
          color="bg-orange-500"
        />
        <StatCard
          label="Tổng XP"
          value={stats?.xpTotal ?? 0}
          icon={Zap}
          color="bg-yellow-500"
        />
        <StatCard
          label="Thẻ học"
          value={stats?.totalCards ?? 0}
          icon={BookOpen}
          color="bg-blue-500"
        />
        <StatCard
          label="Từ đã thuộc"
          value={stats?.masteredWords ?? 0}
          icon={Star}
          color="bg-green-500"
        />
        <StatCard
          label="Hôm nay"
          value={`${stats?.completedToday ?? 0}/${stats?.todayGoal ?? 0}`}
          icon={Target}
          color="bg-purple-500"
        />
      </div>
    </div>
  )
}
