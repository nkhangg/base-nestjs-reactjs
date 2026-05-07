import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookText,
  FolderOpen,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Send,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
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
import { ROUTES, articleEditPath } from '@config/routes'
import {
  useArticleList,
  usePendingArticles,
  useDeleteArticle,
  usePublishArticle,
  useUnpublishArticle,
  useApproveArticle,
  useRejectArticle,
} from '../hooks/useArticle'
import {
  useCategoryList,
  useDeleteCategory,
  useTagList,
  useDeleteTag,
} from '../hooks/useArticleTaxonomy'
import { ArticleCategoryModal } from './ArticleCategoryModal'
import { ArticleTagModal } from './ArticleTagModal'
import type { Article, ArticleCategory, ArticleTag, ArticleStatus } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────────

type ArticleRow = Article & Record<string, unknown>
type CategoryRow = ArticleCategory & Record<string, unknown>
type TagRow = ArticleTag & Record<string, unknown>

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ArticleStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
  published: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<ArticleStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  published: 'Đã xuất bản',
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'N1',
  2: 'N2',
  3: 'N3',
  4: 'N4',
  5: 'N5',
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-teal-100 text-teal-700',
  5: 'bg-green-100 text-green-700',
}

const STATUS_OPTIONS = [
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Từ chối', value: 'rejected' },
  { label: 'Đã xuất bản', value: 'published' },
]

const LEVEL_OPTIONS = [
  { label: 'N1', value: '1' },
  { label: 'N2', value: '2' },
  { label: 'N3', value: '3' },
  { label: 'N4', value: '4' },
  { label: 'N5', value: '5' },
]

// ── Article action dropdown ───────────────────────────────────────────────────

function ArticleActions({ article }: { article: Article }) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteArticle = useDeleteArticle()
  const publishArticle = usePublishArticle()
  const unpublishArticle = useUnpublishArticle()
  const approveArticle = useApproveArticle()
  const rejectArticle = useRejectArticle()

  if (confirmDelete) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xóa bài đọc?</span>
          <button
            onClick={() =>
              deleteArticle.mutate(article.id, {
                onSuccess: () => { toast.success('Đã xóa bài đọc'); setConfirmDelete(false) },
                onError: () => toast.error('Xóa thất bại'),
              })
            }
            disabled={deleteArticle.isPending}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteArticle.isPending ? '...' : 'Xóa'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600"
          >
            Huỷ
          </button>
        </div>
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
            <BookText className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate(articleEditPath(article.id))} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
          </DropdownMenuItem>

          {article.status === 'pending' && (
            <>
              <DropdownMenuItem
                onClick={() =>
                  approveArticle.mutate(article.id, {
                    onSuccess: () => toast.success('Đã phê duyệt bài đọc'),
                    onError: () => toast.error('Phê duyệt thất bại'),
                  })
                }
                disabled={approveArticle.isPending}
                className="gap-2 text-blue-700 focus:bg-blue-50 focus:text-blue-700"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Phê duyệt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  rejectArticle.mutate(article.id, {
                    onSuccess: () => toast.info('Đã từ chối bài đọc'),
                    onError: () => toast.error('Từ chối thất bại'),
                  })
                }
                disabled={rejectArticle.isPending}
                className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <XCircle className="h-3.5 w-3.5" />
                Từ chối
              </DropdownMenuItem>
            </>
          )}

          {article.status === 'approved' && (
            <DropdownMenuItem
              onClick={() =>
                publishArticle.mutate(article.id, {
                  onSuccess: () => toast.success('Đã xuất bản bài đọc'),
                  onError: () => toast.error('Xuất bản thất bại'),
                })
              }
              disabled={publishArticle.isPending}
              className="gap-2 text-green-700 focus:bg-green-50 focus:text-green-700"
            >
              <Send className="h-3.5 w-3.5" />
              Xuất bản
            </DropdownMenuItem>
          )}

          {article.status === 'published' && (
            <DropdownMenuItem
              onClick={() =>
                unpublishArticle.mutate(article.id, {
                  onSuccess: () => toast.info('Đã gỡ xuất bản'),
                  onError: () => toast.error('Thất bại'),
                })
              }
              disabled={unpublishArticle.isPending}
              className="gap-2"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Gỡ xuất bản
            </DropdownMenuItem>
          )}

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

// ── Category action dropdown ──────────────────────────────────────────────────

function CategoryActions({
  category,
  onEdit,
}: {
  category: ArticleCategory
  onEdit: (c: ArticleCategory) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteCategory = useDeleteCategory()

  if (confirmDelete) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xóa chủ đề?</span>
          <button
            onClick={() =>
              deleteCategory.mutate(category.id, {
                onSuccess: () => { toast.success('Đã xóa chủ đề'); setConfirmDelete(false) },
                onError: () => toast.error('Xóa thất bại'),
              })
            }
            disabled={deleteCategory.isPending}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteCategory.isPending ? '...' : 'Xóa'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600"
          >
            Huỷ
          </button>
        </div>
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
            <FolderOpen className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(category)} className="gap-2">
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

// ── Tag action ────────────────────────────────────────────────────────────────

function TagActions({ tagRow }: { tagRow: ArticleTag }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTag = useDeleteTag()

  if (confirmDelete) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xóa tag?</span>
          <button
            onClick={() =>
              deleteTag.mutate(tagRow.id, {
                onSuccess: () => { toast.success('Đã xóa tag'); setConfirmDelete(false) },
                onError: () => toast.error('Xóa thất bại'),
              })
            }
            disabled={deleteTag.isPending}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteTag.isPending ? '...' : 'Xóa'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600"
          >
            Huỷ
          </button>
        </div>
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
            <Tag className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
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

function buildArticleColumns(): ColumnDef<ArticleRow>[] {
  return [
    {
      key: 'title',
      header: 'Tiêu đề',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900 line-clamp-1">{row.title as string}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.slug as string}</p>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Cấp độ',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: LEVEL_OPTIONS,
      width: '80px',
      render: (value) => {
        if (value == null) return <span className="text-xs text-gray-400">—</span>
        const lvl = value as number
        return (
          <Badge className={cn('text-[11px] font-semibold border-0', LEVEL_COLORS[lvl] ?? 'bg-gray-100 text-gray-600')}>
            {LEVEL_LABELS[lvl] ?? `N${lvl}`}
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
      filterOptions: STATUS_OPTIONS,
      width: '120px',
      render: (value) => {
        const status = value as ArticleStatus
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
      render: (_, row) => <ArticleActions article={row as unknown as Article} />,
    },
  ]
}

function buildCategoryColumns(
  onEdit: (c: ArticleCategory) => void,
): ColumnDef<CategoryRow>[] {
  return [
    {
      key: 'name',
      header: 'Tên chủ đề',
      sortable: true,
      render: (_, row) => {
        const colorCode = row.colorCode as string | null
        return (
          <div className="flex items-center gap-2.5">
            {colorCode ? (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: colorCode }}
              />
            ) : null}
            <div>
              <p className="font-medium text-gray-900">{row.name as string}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{row.slug as string}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'iconUrl',
      header: 'Icon',
      width: '64px',
      render: (value) =>
        value ? (
          <img
            src={value as string}
            alt="icon"
            className="h-7 w-7 rounded object-cover border border-gray-100"
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (_, row) => (
        <CategoryActions
          category={row as unknown as ArticleCategory}
          onEdit={onEdit}
        />
      ),
    },
  ]
}

function buildTagColumns(): ColumnDef<TagRow>[] {
  return [
    {
      key: 'name',
      header: 'Tên tag',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {value as string}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '56px',
      render: (_, row) => <TagActions tagRow={row as unknown as ArticleTag} />,
    },
  ]
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabValue = 'all' | 'pending' | 'categories' | 'tags'

export function ArticlePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null)
  const [showTagModal, setShowTagModal] = useState(false)

  const allTable = useDataTable<ArticleRow>({
    tableId: 'article-all',
    showSearch: true,
    searchPlaceholder: 'Tìm theo tiêu đề...',
    showFilters: true,
    showColumnVisibility: true,
    showDensityToggle: true,
    showRefreshButton: true,
    syncToUrl: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  const pendingTable = useDataTable<ArticleRow>({
    tableId: 'article-pending',
    showSearch: false,
    showRefreshButton: true,
    syncToUrl: false,
    persistPageSize: true,
  })

  const categoryTable = useDataTable<CategoryRow>({
    tableId: 'article-categories',
    showSearch: true,
    searchPlaceholder: 'Tìm chủ đề...',
    showRefreshButton: true,
    syncToUrl: false,
    persistPageSize: true,
  })

  const tagTable = useDataTable<TagRow>({
    tableId: 'article-tags',
    showSearch: true,
    searchPlaceholder: 'Tìm tag...',
    showRefreshButton: true,
    syncToUrl: false,
    persistPageSize: true,
  })

  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
    refetch: refetchAll,
  } = useArticleList(allTable.buildQueryParams(['title']))

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPending,
  } = usePendingArticles(pendingTable.buildQueryParams([]))

  const { data: categoriesData, isLoading: catsLoading, isError: catsError, refetch: refetchCats } = useCategoryList()
  const { data: tagsData, isLoading: tagsLoading, isError: tagsError, refetch: refetchTags } = useTagList()

  const articles = allData?.data ?? []
  const pending = pendingData?.data ?? []
  const categories = categoriesData?.data ?? []
  const tags = tagsData?.data ?? []

  const totalPublished = articles.filter((a) => a.status === 'published').length
  const totalPending = allData?.meta
    ? articles.filter((a) => a.status === 'pending').length
    : (pendingData?.meta?.totalItems ?? 0)

  const articleColumns = buildArticleColumns()
  const categoryColumns = buildCategoryColumns((c) => {
    setEditingCategory(c)
    setShowCategoryModal(true)
  })
  const tagColumns = buildTagColumns()

  const renderHeaderAction = () => {
    if (activeTab === 'all' || activeTab === 'pending') {
      return (
        <Button onClick={() => navigate(ROUTES.ARTICLES_NEW)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Tạo bài đọc
        </Button>
      )
    }
    if (activeTab === 'categories') {
      return (
        <Button
          onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tạo chủ đề
        </Button>
      )
    }
    return (
      <Button onClick={() => setShowTagModal(true)} className="gap-2 shrink-0">
        <Plus className="h-4 w-4" />
        Tạo tag
      </Button>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bài đọc</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý bài đọc, chủ đề và tags</p>
        </div>
        {renderHeaderAction()}
      </div>

      {/* ── Stat cards ── */}
      {!allError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tổng bài đọc', value: allLoading ? '—' : (allData?.meta?.totalItems ?? 0), icon: BookText },
            { label: 'Đã xuất bản', value: allLoading ? '—' : totalPublished, icon: Send },
            { label: 'Chờ duyệt', value: pendingLoading ? '—' : (pendingData?.meta?.totalItems ?? totalPending), icon: Clock },
            { label: 'Chủ đề', value: catsLoading ? '—' : categories.length, icon: FolderOpen },
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

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="gap-2 px-4 text-sm">
            <BookText className="h-3.5 w-3.5" />
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 px-4 text-sm">
            <Clock className="h-3.5 w-3.5" />
            Chờ duyệt
            {(pendingData?.meta?.totalItems ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-yellow-500 px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                {pendingData?.meta?.totalItems}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-4 text-sm">
            <FolderOpen className="h-3.5 w-3.5" />
            Chủ đề
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2 px-4 text-sm">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* ── All articles ── */}
        <TabsContent value="all" className="mt-4">
          {allError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách bài đọc. Vui lòng thử lại.
            </div>
          ) : (
            <DataTable<ArticleRow>
              columns={articleColumns}
              data={articles as ArticleRow[]}
              loading={allLoading}
              rowKey="id"
              emptyText="Chưa có bài đọc nào"
              table={allTable}
              total={allData?.meta?.totalItems}
              onRefresh={refetchAll}
            />
          )}
        </TabsContent>

        {/* ── Pending ── */}
        <TabsContent value="pending" className="mt-4">
          {pendingError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách chờ duyệt.
            </div>
          ) : (
            <DataTable<ArticleRow>
              columns={articleColumns}
              data={pending as ArticleRow[]}
              loading={pendingLoading}
              rowKey="id"
              emptyText="Không có bài đọc nào đang chờ duyệt"
              table={pendingTable}
              total={pendingData?.meta?.totalItems}
              onRefresh={refetchPending}
            />
          )}
        </TabsContent>

        {/* ── Categories ── */}
        <TabsContent value="categories" className="mt-4">
          {catsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách chủ đề.
            </div>
          ) : (
            <DataTable<CategoryRow>
              columns={categoryColumns}
              data={categories as CategoryRow[]}
              loading={catsLoading}
              rowKey="id"
              emptyText="Chưa có chủ đề nào"
              table={categoryTable}
              onRefresh={refetchCats}
            />
          )}
        </TabsContent>

        {/* ── Tags ── */}
        <TabsContent value="tags" className="mt-4">
          {tagsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách tags.
            </div>
          ) : (
            <DataTable<TagRow>
              columns={tagColumns}
              data={tags as TagRow[]}
              loading={tagsLoading}
              rowKey="id"
              emptyText="Chưa có tag nào"
              table={tagTable}
              onRefresh={refetchTags}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <ArticleCategoryModal
        open={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null) }}
        editingCategory={editingCategory}
      />
      <ArticleTagModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
      />
    </div>
  )
}
