import { useState } from 'react'
import {
  Settings,
  Plus,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { DataTable, type ColumnDef } from '@shared/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import { cn } from '@shared/utils'
import {
  useConfigs,
  useConfigTableState,
  useToggleConfig,
  useDeleteConfig,
} from '../hooks/useConfigs'
import { ConfigFormModal } from './ConfigFormModal'
import type { AppConfig } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfigRow = AppConfig & Record<string, unknown>

// ── Constants ─────────────────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  { label: 'Public', value: 'public' },
  { label: 'Members', value: 'members' },
  { label: 'Internal', value: 'internal' },
]

const SCOPE_COLORS: Record<string, string> = {
  public: 'bg-green-100 text-green-700',
  members: 'bg-blue-100 text-blue-700',
  internal: 'bg-orange-100 text-orange-700',
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyKeyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={copy}
      title="Copy key"
      className="rounded p-0.5 text-gray-300 transition-colors hover:text-gray-500"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ── Action dropdown ───────────────────────────────────────────────────────────

function ActionDropdown({
  config,
  onEdit,
}: {
  config: AppConfig
  onEdit: (c: AppConfig) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const toggleConfig = useToggleConfig()
  const deleteConfig = useDeleteConfig()

  if (confirmDelete) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xóa vĩnh viễn?</span>
          <button
            onClick={() =>
              deleteConfig.mutate(config.id, {
                onSuccess: () => setConfirmDelete(false),
                onError: () => setDeleteError('Xóa thất bại'),
              })
            }
            disabled={deleteConfig.isPending}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteConfig.isPending ? '...' : 'Xóa'}
          </button>
          <button
            onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600"
          >
            Huỷ
          </button>
        </div>
        {deleteError && <p className="text-[10px] text-red-500">{deleteError}</p>}
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 data-[state=open]:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(config)} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toggleConfig.mutate(config.id)}
            disabled={toggleConfig.isPending}
            className="gap-2"
          >
            {config.isEnabled ? (
              <><ToggleRight className="h-3.5 w-3.5 text-gray-500" />Tắt</>
            ) : (
              <><ToggleLeft className="h-3.5 w-3.5 text-green-500" />Bật</>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(onEdit: (c: AppConfig) => void): ColumnDef<ConfigRow>[] {
  return [
    {
      key: 'key',
      header: 'Key',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-medium text-gray-900">
            {row.key as string}
          </span>
          <CopyKeyButton value={row.key as string} />
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      filterable: true,
      filterType: 'select',
      filterOptions: SCOPE_OPTIONS,
      width: '130px',
      render: (value) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
            SCOPE_COLORS[value as string] ?? 'bg-gray-100 text-gray-600',
          )}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'isEnabled',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Enabled', value: 'true' },
        { label: 'Disabled', value: 'false' },
      ],
      width: '110px',
      render: (value) => {
        const enabled = value === true
        return (
          <Badge
            className={cn(
              'text-[11px] font-medium border-0',
              enabled ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500',
            )}
          >
            <span
              className={cn(
                'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
                enabled ? 'bg-white/70' : 'bg-gray-400',
              )}
            />
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        )
      },
    },
    {
      key: 'tags',
      header: 'Tags',
      width: '160px',
      render: (value) => {
        const tags = value as string[]
        if (!tags?.length) return <span className="text-xs text-gray-400">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'value',
      header: 'Value (preview)',
      render: (value) => (
        <span className="font-mono text-xs text-gray-500 truncate max-w-[200px] block">
          {JSON.stringify(value).slice(0, 60)}
          {JSON.stringify(value).length > 60 ? '…' : ''}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      sortable: true,
      width: '120px',
      className: 'text-gray-500 text-xs',
      render: (value) =>
        new Date(value as string).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (_, row) => (
        <ActionDropdown config={row as unknown as AppConfig} onEdit={onEdit} />
      ),
    },
  ]
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ConfigPage() {
  const { state, setPage, setPageSize, setSort, setSearch, setFilters } =
    useConfigTableState()
  const { data, isLoading, isError } = useConfigs(state)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AppConfig | null>(null)

  const configs = data?.data ?? []
  const meta = data?.meta
  const columns = buildColumns((c) => { setEditingConfig(c); setShowForm(true) })

  const totalEnabled = configs.filter((c) => c.isEnabled).length
  const totalDisabled = configs.filter((c) => !c.isEnabled).length

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Config Management</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý cấu hình hệ thống dạng key-value JSON</p>
        </div>
        <Button
          onClick={() => { setEditingConfig(null); setShowForm(true) }}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tạo config
        </Button>
      </div>

      {/* ── Stat cards ── */}
      {!isError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Tổng config', value: isLoading ? '—' : (meta?.totalItems ?? 0), icon: Settings },
            { label: 'Đang bật', value: isLoading ? '—' : totalEnabled, icon: ToggleRight },
            { label: 'Đang tắt', value: isLoading ? '—' : totalDisabled, icon: ToggleLeft },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-semibold text-gray-900 leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Không thể tải danh sách config. Vui lòng thử lại.
        </div>
      )}

      {/* ── DataTable ── */}
      {!isError && (
        <DataTable<ConfigRow>
          columns={columns}
          data={configs as ConfigRow[]}
          loading={isLoading}
          rowKey="id"
          emptyText="Chưa có config nào"
          searchable
          searchPlaceholder="Tìm theo key..."
          total={meta?.totalItems}
          page={state.page}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSort={setSort}
          onSearch={setSearch}
          onFilter={setFilters}
        />
      )}

      {/* ── Modal ── */}
      <ConfigFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditingConfig(null) }}
        editingConfig={editingConfig}
      />
    </div>
  )
}
