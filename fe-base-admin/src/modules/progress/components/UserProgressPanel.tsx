import { format } from 'date-fns'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable, useDataTable, type ColumnDef } from '@shared/components/ui/data-table'
import { Skeleton } from '@shared/components/ui/skeleton'
import { cn } from '@shared/utils'
import { useUserProgress } from '../hooks/useProgress'
import type { ActivityLog, ActionType } from '../types'

// ── Action type badge ─────────────────────────────────────────────────────────

const ACTION_STYLES: Record<ActionType, string> = {
  read_article: 'bg-blue-100 text-blue-700',
  quiz_done: 'bg-purple-100 text-purple-700',
  flashcard_review: 'bg-green-100 text-green-700',
  login: 'bg-gray-100 text-gray-600',
}

function ActionBadge({ type }: { type: ActionType }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
        ACTION_STYLES[type] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {t(`progress.actionType.${type}`)}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

// ── Columns ───────────────────────────────────────────────────────────────────

type ActivityRow = ActivityLog & Record<string, unknown>

const columns: ColumnDef<ActivityRow>[] = [
  {
    key: 'createdAt',
    header: 'Thời gian',
    sortable: true,
    width: '140px',
    render: (value) => {
      const d = new Date(value as string)
      return (
        <div>
          <p className="text-xs font-medium text-gray-800 tabular-nums">
            {format(d, 'dd/MM/yyyy')}
          </p>
          <p className="text-[11px] text-gray-400 tabular-nums">{format(d, 'HH:mm:ss')}</p>
        </div>
      )
    },
  },
  {
    key: 'actionType',
    header: 'Hành động',
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Đọc bài', value: 'read_article' },
      { label: 'Làm bài kiểm tra', value: 'quiz_done' },
      { label: 'Ôn thẻ học', value: 'flashcard_review' },
      { label: 'Đăng nhập', value: 'login' },
    ],
    render: (value) => <ActionBadge type={value as ActionType} />,
  },
  {
    key: 'xpGained',
    header: 'XP',
    sortable: true,
    width: '80px',
    render: (value) => (
      <span className="font-semibold tabular-nums text-amber-600">+{value as number}</span>
    ),
  },
  {
    key: 'referenceId',
    header: 'Reference',
    defaultHidden: true,
    render: (value) =>
      value ? (
        <span className="font-mono text-xs text-gray-400">
          {(value as string).slice(0, 8)}…
        </span>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      ),
  },
]

// ── Main ──────────────────────────────────────────────────────────────────────

interface UserProgressPanelProps {
  userId: string
}

export function UserProgressPanel({ userId }: UserProgressPanelProps) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useUserProgress(userId)

  const logs = data?.data ?? []
  const total = data?.total ?? 0

  const totalXp = logs.reduce((sum, l) => sum + l.xpGained, 0)
  const uniqueDays = new Set(logs.map((l) => new Date(l.createdAt).toISOString().slice(0, 10))).size

  const table = useDataTable<ActivityRow>({
    tableId: `progress-user-${userId}`,
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    persistPageSize: false,
    persistFilters: false,
    persistSort: false,
  })

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Không thể tải dữ liệu. Vui lòng thử lại.</span>
        <button
          onClick={() => void refetch()}
          className="ml-auto flex items-center gap-1 text-xs underline hover:no-underline"
        >
          <RefreshCw className="h-3 w-3" />
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label={t('progress.xpTotal')} value={totalXp} />
            <StatCard label={t('progress.activityLog')} value={total} />
            <StatCard label="Ngày hoạt động" value={uniqueDays} />
          </>
        )}
      </div>

      {/* Activity log table */}
      {!isLoading && logs.length === 0 ? (
        <div className="rounded-lg border bg-white px-4 py-10 text-center text-sm text-gray-400">
          Chưa có dữ liệu hoạt động
        </div>
      ) : (
        <DataTable<ActivityRow>
          columns={columns}
          data={logs as ActivityRow[]}
          loading={isLoading}
          rowKey="id"
          emptyText="Chưa có log nào"
          table={table}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
