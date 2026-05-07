import { useState } from 'react'
import { BookOpen, Clock, CheckCircle, Plus, Pencil, Trash2, AlertTriangle, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { DataTable, useDataTable, type ColumnDef } from '@shared/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { cn } from '@shared/utils'
import {
  useDictionaryList,
  usePendingDictionary,
  useDeleteDictionary,
  useApproveDictionary,
  useRejectDictionary,
} from '../hooks/useDictionary'
import { DictionaryEntryModal } from './DictionaryEntryModal'
import { RejectReasonDialog } from './RejectReasonDialog'
import type { DictionaryEntry, DictionaryStatus } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

type EntryRow = DictionaryEntry & Record<string, unknown>

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<DictionaryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<DictionaryStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

const STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Từ chối', value: 'rejected' },
]

const JLPT_OPTIONS = [
  { label: 'N1', value: '1' },
  { label: 'N2', value: '2' },
  { label: 'N3', value: '3' },
  { label: 'N4', value: '4' },
  { label: 'N5', value: '5' },
]

// ── Entry actions dropdown ─────────────────────────────────────────────────────

function EntryActions({
  entry,
  onEdit,
}: {
  entry: DictionaryEntry
  onEdit: (e: DictionaryEntry) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteEntry = useDeleteDictionary()

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-xs text-gray-500">Xóa từ này?</span>
        <button
          onClick={() =>
            deleteEntry.mutate(entry.id, {
              onSuccess: () => { toast.success('Đã xóa từ'); setConfirmDelete(false) },
              onError: () => toast.error('Xóa thất bại'),
            })
          }
          disabled={deleteEntry.isPending}
          className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleteEntry.isPending ? '...' : 'Xóa'}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600"
        >
          Huỷ
        </button>
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
            <BookOpen className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(entry)} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
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

// ── Pending entry row actions (inline approve/reject) ─────────────────────────

function PendingEntryActions({
  entry,
  onReject,
}: {
  entry: DictionaryEntry
  onReject: (entry: DictionaryEntry) => void
}) {
  const approveEntry = useApproveDictionary()

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        onClick={() =>
          approveEntry.mutate(entry.id, {
            onSuccess: () => toast.success(`Đã duyệt: ${entry.hiragana}`),
            onError: () => toast.error('Duyệt thất bại'),
          })
        }
        disabled={approveEntry.isPending}
        className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
      >
        <Check className="h-3 w-3" />
        Duyệt
      </button>
      <button
        onClick={() => onReject(entry)}
        className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 transition-colors"
      >
        <X className="h-3 w-3" />
        Từ chối
      </button>
    </div>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildAllColumns(onEdit: (e: DictionaryEntry) => void): ColumnDef<EntryRow>[] {
  return [
    {
      key: 'hiragana',
      header: 'Từ',
      sortable: true,
      render: (_, row) => (
        <div>
          {row.kanji && (
            <p className="font-medium text-gray-900 text-base leading-none">{row.kanji as string}</p>
          )}
          <p className={cn('text-gray-700', row.kanji ? 'text-xs mt-0.5' : 'font-medium text-base')}>
            {row.hiragana as string}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.romaji as string}</p>
        </div>
      ),
    },
    {
      key: 'meanings',
      header: 'Nghĩa',
      render: (value) => {
        const meanings = value as string[]
        if (!meanings?.length) return <span className="text-xs text-gray-400">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {meanings.slice(0, 3).map((m) => (
              <span
                key={m}
                className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700"
              >
                {m}
              </span>
            ))}
            {meanings.length > 3 && (
              <span className="text-xs text-gray-400">+{meanings.length - 3}</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'jlptLevel',
      header: 'JLPT',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: JLPT_OPTIONS,
      width: '80px',
      render: (value) =>
        value ? (
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[11px]">
            N{value as number}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: STATUS_OPTIONS,
      width: '120px',
      render: (value) => {
        const status = value as DictionaryStatus
        return (
          <Badge className={cn('text-[11px] font-medium border-0', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600')}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      sortable: true,
      width: '110px',
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
      render: (_, row) => <EntryActions entry={row as unknown as DictionaryEntry} onEdit={onEdit} />,
    },
  ]
}

function buildPendingColumns(
  onReject: (e: DictionaryEntry) => void,
): ColumnDef<EntryRow>[] {
  return [
    {
      key: 'hiragana',
      header: 'Từ',
      render: (_, row) => (
        <div>
          {row.kanji && (
            <p className="font-medium text-gray-900 text-base leading-none">{row.kanji as string}</p>
          )}
          <p className={cn('text-gray-700', row.kanji ? 'text-xs mt-0.5' : 'font-medium text-base')}>
            {row.hiragana as string}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.romaji as string}</p>
        </div>
      ),
    },
    {
      key: 'meanings',
      header: 'Nghĩa',
      render: (value) => {
        const meanings = value as string[]
        return (
          <div className="flex flex-wrap gap-1">
            {(meanings ?? []).map((m) => (
              <span key={m} className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                {m}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'jlptLevel',
      header: 'JLPT',
      width: '80px',
      render: (value) =>
        value ? (
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[11px]">N{value as number}</Badge>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Ngày gửi',
      width: '110px',
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
      width: '160px',
      render: (_, row) => (
        <PendingEntryActions
          entry={row as unknown as DictionaryEntry}
          onReject={onReject}
        />
      ),
    },
  ]
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DictionaryPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all')
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null)
  const [rejectingEntry, setRejectingEntry] = useState<DictionaryEntry | null>(null)

  const allTable = useDataTable<EntryRow>({
    tableId: 'dictionary-all',
    showSearch: true,
    searchPlaceholder: 'Tìm kanji, hiragana, romaji...',
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    syncToUrl: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  const pendingTable = useDataTable<EntryRow>({
    tableId: 'dictionary-pending',
    showSearch: true,
    searchPlaceholder: 'Tìm trong danh sách chờ duyệt...',
    showRefreshButton: true,
  })

  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
    refetch: refetchAll,
  } = useDictionaryList(allTable.buildQueryParams(['kanji', 'hiragana', 'romaji']))

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPending,
  } = usePendingDictionary()

  const rejectEntry = useRejectDictionary()

  const entries = allData?.data ?? []
  const entriesMeta = allData?.meta
  const pendingEntries = pendingData ?? []
  const pendingCount = pendingEntries.length

  const allColumns = buildAllColumns((e) => { setEditingEntry(e); setShowEntryModal(true) })
  const pendingColumns = buildPendingColumns((e) => setRejectingEntry(e))

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Từ điển</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý kho từ vựng tiếng Nhật</p>
        </div>
        <Button
          onClick={() => { setEditingEntry(null); setShowEntryModal(true) }}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Thêm từ mới
        </Button>
      </div>

      {/* ── Stat cards ── */}
      {!allError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Tổng từ vựng', value: allLoading ? '—' : (entriesMeta?.totalItems ?? 0), icon: BookOpen, color: 'bg-gray-100 text-gray-600' },
            { label: 'Chờ duyệt', value: pendingLoading ? '—' : pendingCount, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
            { label: 'Đã duyệt', value: allLoading ? '—' : entries.filter((e) => e.status === 'approved').length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color.split(' ')[0])}>
                <Icon className={cn('h-4 w-4', color.split(' ')[1])} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-semibold text-gray-900 leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'pending')}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="gap-2 px-4 text-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 px-4 text-sm">
            <Clock className="h-3.5 w-3.5" />
            Chờ duyệt
            {pendingCount > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── All tab ── */}
        <TabsContent value="all" className="mt-4">
          {allError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách từ điển. Vui lòng thử lại.
            </div>
          ) : (
            <DataTable<EntryRow>
              columns={allColumns}
              data={entries as EntryRow[]}
              loading={allLoading}
              rowKey="id"
              emptyText="Chưa có từ nào. Hãy thêm từ đầu tiên!"
              table={allTable}
              total={entriesMeta?.totalItems}
              onRefresh={refetchAll}
            />
          )}
        </TabsContent>

        {/* ── Pending tab ── */}
        <TabsContent value="pending" className="mt-4">
          {pendingError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách chờ duyệt. Vui lòng thử lại.
            </div>
          ) : (
            <DataTable<EntryRow>
              columns={pendingColumns}
              data={pendingEntries as EntryRow[]}
              loading={pendingLoading}
              rowKey="id"
              emptyText="Không có từ nào đang chờ duyệt"
              table={pendingTable}
              onRefresh={refetchPending}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <DictionaryEntryModal
        open={showEntryModal}
        onClose={() => { setShowEntryModal(false); setEditingEntry(null) }}
        editingEntry={editingEntry}
      />

      <RejectReasonDialog
        open={!!rejectingEntry}
        onClose={() => setRejectingEntry(null)}
        entryLabel={rejectingEntry ? `${rejectingEntry.kanji ?? rejectingEntry.hiragana} (${rejectingEntry.romaji})` : undefined}
        onConfirm={(reason) => {
          if (!rejectingEntry) return
          rejectEntry.mutate(
            { id: rejectingEntry.id, dto: reason ? { reason } : undefined },
            {
              onSuccess: () => {
                toast.success(`Đã từ chối: ${rejectingEntry.hiragana}`)
                setRejectingEntry(null)
              },
              onError: () => toast.error('Từ chối thất bại'),
            },
          )
        }}
        isPending={rejectEntry.isPending}
      />
    </div>
  )
}
