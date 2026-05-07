import { useState } from 'react'
import {
  HelpCircle, Clock, CheckCircle, ListChecks,
  Plus, Pencil, Trash2, AlertTriangle, Check, X,
} from 'lucide-react'
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
  useQuestionList,
  useDeleteQuestion,
  useApproveQuestion,
  useRejectQuestion,
} from '../hooks/useQuestion'
import { QuestionModal } from './QuestionModal'
import type { Question, QuestionReferenceType, QuestionStatus, QuestionType } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

type QuestionRow = Question & Record<string, unknown>

const STATUS_COLORS: Record<QuestionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<QuestionStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

const TYPE_LABELS: Record<QuestionType, string> = {
  quiz: 'Trắc nghiệm',
  fill_in_blank: 'Điền trống',
  matching: 'Ghép đôi',
}

const TYPE_COLORS: Record<QuestionType, string> = {
  quiz: 'bg-blue-100 text-blue-700',
  fill_in_blank: 'bg-purple-100 text-purple-700',
  matching: 'bg-orange-100 text-orange-700',
}

const REF_LABELS: Record<QuestionReferenceType, string> = {
  none: '—',
  article: 'Bài đọc',
  dictionary: 'Từ điển',
}

const STATUS_FILTER_OPTIONS = [
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Từ chối', value: 'rejected' },
]

const REF_FILTER_OPTIONS = [
  { label: 'Không liên kết', value: 'none' },
  { label: 'Bài đọc', value: 'article' },
  { label: 'Từ điển', value: 'dictionary' },
]

// ── Row actions ───────────────────────────────────────────────────────────────

function QuestionActions({
  question,
  onEdit,
}: {
  question: Question
  onEdit: (q: Question) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteQuestion = useDeleteQuestion()

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-xs text-gray-500">Xóa câu hỏi này?</span>
        <button
          onClick={() =>
            deleteQuestion.mutate(question.id, {
              onSuccess: () => { toast.success('Đã xóa câu hỏi'); setConfirmDelete(false) },
              onError: () => toast.error('Xóa thất bại'),
            })
          }
          disabled={deleteQuestion.isPending}
          className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleteQuestion.isPending ? '...' : 'Xóa'}
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
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(question)} className="gap-2">
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

function PendingQuestionActions({ question }: { question: Question }) {
  const approveQuestion = useApproveQuestion()
  const rejectQuestion = useRejectQuestion()

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <button
        onClick={() =>
          approveQuestion.mutate(question.id, {
            onSuccess: () => toast.success('Đã duyệt câu hỏi'),
            onError: () => toast.error('Duyệt thất bại'),
          })
        }
        disabled={approveQuestion.isPending}
        className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
      >
        <Check className="h-3 w-3" />
        Duyệt
      </button>
      <button
        onClick={() =>
          rejectQuestion.mutate(question.id, {
            onSuccess: () => toast.success('Đã từ chối câu hỏi'),
            onError: () => toast.error('Từ chối thất bại'),
          })
        }
        disabled={rejectQuestion.isPending}
        className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        <X className="h-3 w-3" />
        Từ chối
      </button>
    </div>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildAllColumns(onEdit: (q: Question) => void): ColumnDef<QuestionRow>[] {
  return [
    {
      key: 'questionData',
      header: 'Câu hỏi',
      render: (value) => {
        const qd = value as Question['questionData']
        return (
          <div className="min-w-0 max-w-xs">
            <Badge className={cn('text-[10px] font-medium border-0 mb-1', TYPE_COLORS[qd.type])}>
              {TYPE_LABELS[qd.type]}
            </Badge>
            <p className="text-sm text-gray-800 truncate">
              {qd.prompt || <span className="text-gray-400 italic">Ghép đôi</span>}
            </p>
          </div>
        )
      },
    },
    {
      key: 'referenceType',
      header: 'Liên kết',
      filterable: true,
      filterType: 'select',
      filterOptions: REF_FILTER_OPTIONS,
      width: '100px',
      render: (value) => {
        const ref = (value as QuestionReferenceType) ?? 'none'
        if (ref === 'none') return <span className="text-xs text-gray-400">—</span>
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-0 text-[11px]">
            {REF_LABELS[ref]}
          </Badge>
        )
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: STATUS_FILTER_OPTIONS,
      width: '110px',
      render: (value) => {
        const status = value as QuestionStatus
        return (
          <Badge className={cn('text-[11px] font-medium border-0', STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600')}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )
      },
    },
    {
      key: 'isPublic',
      header: 'Công khai',
      width: '90px',
      render: (value) =>
        value ? (
          <Badge className="bg-green-50 text-green-600 border-0 text-[11px]">Công khai</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-500 border-0 text-[11px]">Nội bộ</Badge>
        ),
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
      render: (_, row) => <QuestionActions question={row as unknown as Question} onEdit={onEdit} />,
    },
  ]
}

function buildPendingColumns(): ColumnDef<QuestionRow>[] {
  return [
    {
      key: 'questionData',
      header: 'Câu hỏi',
      render: (value) => {
        const qd = value as Question['questionData']
        return (
          <div className="min-w-0 max-w-sm">
            <Badge className={cn('text-[10px] font-medium border-0 mb-1', TYPE_COLORS[qd.type])}>
              {TYPE_LABELS[qd.type]}
            </Badge>
            <p className="text-sm text-gray-800 truncate">
              {qd.prompt || <span className="text-gray-400 italic">Ghép đôi</span>}
            </p>
          </div>
        )
      },
    },
    {
      key: 'referenceType',
      header: 'Liên kết',
      width: '100px',
      render: (value) => {
        const ref = (value as QuestionReferenceType) ?? 'none'
        if (ref === 'none') return <span className="text-xs text-gray-400">—</span>
        return <Badge className="bg-indigo-50 text-indigo-700 border-0 text-[11px]">{REF_LABELS[ref]}</Badge>
      },
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
      width: '170px',
      render: (_, row) => <PendingQuestionActions question={row as unknown as Question} />,
    },
  ]
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuestionPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const allTable = useDataTable<QuestionRow>({
    tableId: 'question-all',
    showSearch: false,
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    syncToUrl: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  const pendingTable = useDataTable<QuestionRow>({
    tableId: 'question-pending',
    showRefreshButton: true,
  })

  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
    refetch: refetchAll,
  } = useQuestionList(allTable.buildQueryParams([]))

  // Pending tab: fixed filter status=pending
  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPending,
  } = useQuestionList({ ...pendingTable.buildQueryParams([]), 'filter.status': '$eq:pending' })

  const questions = allData?.data ?? []
  const questionsMeta = allData?.meta
  const pendingQuestions = pendingData?.data ?? []
  const pendingCount = pendingData?.meta?.totalItems ?? 0

  const allColumns = buildAllColumns((q) => { setEditingQuestion(q); setShowModal(true) })
  const pendingColumns = buildPendingColumns()

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Câu hỏi</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý câu hỏi JLPT và ngữ pháp</p>
        </div>
        <Button
          onClick={() => { setEditingQuestion(null); setShowModal(true) }}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tạo câu hỏi
        </Button>
      </div>

      {/* ── Stat cards ── */}
      {!allError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Tổng câu hỏi',
              value: allLoading ? '—' : (questionsMeta?.totalItems ?? 0),
              icon: ListChecks,
              color: 'bg-gray-100 text-gray-600',
            },
            {
              label: 'Chờ duyệt',
              value: pendingLoading ? '—' : pendingCount,
              icon: Clock,
              color: 'bg-yellow-100 text-yellow-600',
            },
            {
              label: 'Đã duyệt',
              value: allLoading ? '—' : questions.filter((q) => q.status === 'approved').length,
              icon: CheckCircle,
              color: 'bg-green-100 text-green-600',
            },
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
            <HelpCircle className="h-3.5 w-3.5" />
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 px-4 text-sm">
            <Clock className="h-3.5 w-3.5" />
            Chờ duyệt
            {pendingCount > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold text-white">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── All tab ── */}
        <TabsContent value="all" className="mt-4">
          {allError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách câu hỏi. Vui lòng thử lại.
            </div>
          ) : (
            <DataTable<QuestionRow>
              columns={allColumns}
              data={questions as QuestionRow[]}
              loading={allLoading}
              rowKey="id"
              emptyText="Chưa có câu hỏi nào. Hãy tạo câu hỏi đầu tiên!"
              table={allTable}
              total={questionsMeta?.totalItems}
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
            <DataTable<QuestionRow>
              columns={pendingColumns}
              data={pendingQuestions as QuestionRow[]}
              loading={pendingLoading}
              rowKey="id"
              emptyText="Không có câu hỏi nào đang chờ duyệt"
              table={pendingTable}
              total={pendingData?.meta?.totalItems}
              onRefresh={refetchPending}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modal ── */}
      <QuestionModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingQuestion(null) }}
        editingQuestion={editingQuestion}
      />
    </div>
  )
}
