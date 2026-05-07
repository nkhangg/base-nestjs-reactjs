import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart2, Trophy, AlertTriangle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Badge } from '@shared/components/ui/badge'
import { Skeleton } from '@shared/components/ui/skeleton'
import { useUsers } from '@modules/user'
import { useLeaderboard } from '../hooks/useProgress'
import { UserProgressPanel } from './UserProgressPanel'
import type { LeaderboardPeriod } from '../services/progress.service'

// ── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>
  if (rank === 2) return <span className="text-base">🥈</span>
  if (rank === 3) return <span className="text-base">🥉</span>
  return (
    <span className="tabular-nums text-sm font-semibold text-gray-400 w-6 text-center">
      {rank}
    </span>
  )
}

// ── Leaderboard tab ───────────────────────────────────────────────────────────

function LeaderboardTab() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time')
  const { data, isLoading, isError } = useLeaderboard(period)
  const entries = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Top 50 người học theo điểm XP</p>
        <Select value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">Tất cả thời gian</SelectItem>
            <SelectItem value="weekly">7 ngày qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Không thể tải bảng xếp hạng.
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-white p-3">
              <Skeleton className="h-5 w-6 rounded" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-gray-400">
          Chưa có dữ liệu
        </div>
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.map((entry, idx) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 ${idx < 3 ? 'border-amber-200' : ''}`}
            >
              <div className="flex w-7 items-center justify-center">
                <RankBadge rank={idx + 1} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {entry.name ?? entry.email}
                </p>
                {entry.name && (
                  <p className="truncate text-xs text-gray-400">{entry.email}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-600 tabular-nums">
                  {entry.xpTotal.toLocaleString()} XP
                </p>
                {period === 'weekly' && entry.weeklyXp !== undefined && (
                  <p className="text-xs text-gray-400 tabular-nums">
                    +{entry.weeklyXp.toLocaleString()} tuần này
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── User progress tab ─────────────────────────────────────────────────────────

function UserProgressTab() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedUserId, setSelectedUserId] = useState<string>(
    searchParams.get('userId') ?? '',
  )

  const { data: usersData, isLoading: usersLoading } = useUsers({ page: 1, limit: 100, sortBy: 'email:asc' })
  const users = usersData?.data ?? []

  function handleSelect(userId: string) {
    setSelectedUserId(userId)
    setSearchParams(userId ? { userId } : {}, { replace: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={selectedUserId || undefined}
          onValueChange={handleSelect}
          disabled={usersLoading}
        >
          <SelectTrigger className="w-80">
            <SelectValue placeholder={t('progress.selectUser')} />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <span className="text-sm">{user.email}</span>
                {!user.isActive && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    inactive
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUserId ? (
        <UserProgressPanel userId={selectedUserId} />
      ) : (
        <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-gray-400">
          {t('progress.selectUser')} để xem tiến độ học tập
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ProgressPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900">
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('progress.title')}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Theo dõi tiến độ học tập và bảng xếp hạng XP
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            {t('progress.leaderboard')}
          </TabsTrigger>
          <TabsTrigger value="user">
            {t('progress.selectUser')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <LeaderboardTab />
        </TabsContent>

        <TabsContent value="user" className="mt-4">
          <UserProgressTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
