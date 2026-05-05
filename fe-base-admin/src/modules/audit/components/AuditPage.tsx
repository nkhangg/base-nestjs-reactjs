import { format } from 'date-fns'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { Badge } from '@shared/components/ui/badge'
import { DataTable, useDataTable, type ColumnDef } from '@shared/components/ui/data-table'
import { cn } from '@shared/utils'
import { useAuditLogs } from '../hooks/useAuditLogs'
import type { AuditLog } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

type AuditRow = AuditLog & Record<string, unknown>

// ── Method badge ──────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PATCH: 'bg-amber-100 text-amber-700',
  PUT: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-600',
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
        METHOD_STYLES[method.toUpperCase()] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {method.toUpperCase()}
    </span>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ code }: { code: number }) {
  const cls =
    code >= 500
      ? 'bg-red-100 text-red-600'
      : code >= 400
        ? 'bg-amber-100 text-amber-700'
        : code >= 300
          ? 'bg-blue-100 text-blue-600'
          : 'bg-green-100 text-green-700'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        cls,
      )}
    >
      {code}
    </span>
  )
}

// ── Permission badge ──────────────────────────────────────────────────────────

const PERMISSION_STYLES: Record<string, string> = {
  read: 'bg-gray-100 text-gray-600',
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-600',
  export: 'bg-purple-100 text-purple-700',
  approve: 'bg-indigo-100 text-indigo-700',
}

function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
        PERMISSION_STYLES[permission] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {permission}
    </span>
  )
}

// ── Duration display ──────────────────────────────────────────────────────────

function DurationCell({ ms }: { ms: number }) {
  const cls =
    ms >= 1000
      ? 'text-red-600 font-medium'
      : ms >= 200
        ? 'text-amber-600'
        : 'text-gray-500'

  return (
    <span className={cn('text-xs tabular-nums', cls)}>
      {ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`}
    </span>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

const PERMISSION_OPTIONS = [
  { label: 'Read', value: 'read' },
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Export', value: 'export' },
  { label: 'Approve', value: 'approve' },
]

const columns: ColumnDef<AuditRow>[] = [
  {
    key: 'occurredAt',
    header: 'Time',
    sortable: true,
    hideable: false,
    filterable: true,
    filterType: 'date-range',
    filterPlaceholder: 'Chọn khoảng ngày...',
    width: '140px',
    render: (value) => {
      const d = new Date(value as string)
      return (
        <div>
          <p className="text-xs font-medium text-gray-800 tabular-nums">
            {format(d, 'dd/MM/yyyy')}
          </p>
          <p className="text-[11px] text-gray-400 tabular-nums">
            {format(d, 'HH:mm:ss')}
          </p>
        </div>
      )
    },
  },
  {
    key: 'actorEmail',
    header: 'Actor',
    sortable: true,
    filterable: true,
    filterType: 'text',
    filterPlaceholder: 'Filter by email...',
    render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
          {row.actorEmail as string}
        </p>
        <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
          {row.actorRole as string}
        </span>
      </div>
    ),
  },
  {
    key: 'resource',
    header: 'Resource',
    sortable: true,
    filterable: true,
    filterType: 'text',
    filterPlaceholder: 'Filter by resource...',
    render: (value) => (
      <Badge className="bg-gray-100 text-gray-700 border-0 font-mono text-[11px] hover:bg-gray-100">
        {value as string}
      </Badge>
    ),
  },
  {
    key: 'permission',
    header: 'Action',
    filterable: true,
    filterType: 'select',
    filterOptions: PERMISSION_OPTIONS,
    width: '110px',
    render: (value) => <PermissionBadge permission={value as string} />,
  },
  {
    key: 'method',
    header: 'Request',
    render: (value, row) => (
      <div className="flex items-center gap-2 min-w-0">
        <MethodBadge method={value as string} />
        <span className="font-mono text-[11px] text-gray-500 truncate">
          {row.path as string}
        </span>
      </div>
    ),
  },
  {
    key: 'statusCode',
    header: 'Status',
    width: '100px',
    render: (value, row) => (
      <div className="flex flex-col gap-0.5">
        <StatusBadge code={value as number} />
        <DurationCell ms={row.durationMs as number} />
      </div>
    ),
  },
  {
    key: 'actorId',
    header: 'Actor ID',
    defaultHidden: true,
    filterable: true,
    filterType: 'text',
    filterPlaceholder: 'Filter by actor ID...',
    width: '120px',
    render: (value) => (
      <span className="font-mono text-xs text-gray-400">
        {(value as string).slice(0, 8)}…
      </span>
    ),
  },
  {
    key: 'ipAddress',
    header: 'IP Address',
    defaultHidden: true,
    width: '130px',
    className: 'font-mono text-xs text-gray-500',
  },
  {
    key: 'userAgent',
    header: 'User Agent',
    defaultHidden: true,
    render: (value) => (
      <span className="text-[11px] text-gray-400 truncate block max-w-[260px]">
        {value as string}
      </span>
    ),
  },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export function AuditPage() {
  const table = useDataTable<AuditRow>({
    tableId: 'audit-logs',
    showSearch: true,
    searchPlaceholder: 'Tìm theo email, resource...',
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
    syncToUrl: true,
  })

  const { data, isLoading, isError, refetch } = useAuditLogs(
    table.buildQueryParams(['actorEmail', 'resource']),
  )

  const logs = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Lịch sử hoạt động của tất cả admin trên hệ thống
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Không thể tải audit logs. Vui lòng thử lại.
        </div>
      )}

      {/* ── DataTable ── */}
      {!isError && (
        <DataTable<AuditRow>
          columns={columns}
          data={logs as AuditRow[]}
          loading={isLoading}
          rowKey="id"
          emptyText="Chưa có log nào"
          table={table}
          total={meta?.totalItems}
          onRefresh={refetch}
        />
      )}
    </div>
  )
}
