import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Send,
  EyeOff,
  AlertTriangle,
  Archive,
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
import { ROUTES, blogEditPath } from '@config/routes'
import {
  useBlogPosts,
  useDeletePost,
  usePublishPost,
  useUnpublishPost,
} from '../hooks/useBlogPosts'
import { useBlogCategories, useBlogCategoriesAll, useDeleteCategory } from '../hooks/useBlogCategories'
import { BlogCategoryModal } from './BlogCategoryModal'
import type { BlogPost, BlogCategory, BlogPostStatus } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

type PostRow = BlogPost & Record<string, unknown>
type CategoryRow = BlogCategory & Record<string, unknown>

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<BlogPostStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

// ── Post action dropdown ──────────────────────────────────────────────────────

function PostActions({ post }: { post: BlogPost }) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deletePost = useDeletePost()
  const publishPost = usePublishPost()
  const unpublishPost = useUnpublishPost()

  if (confirmDelete) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xóa bài viết?</span>
          <button
            onClick={() =>
              deletePost.mutate(post.id, {
                onSuccess: () => { toast.success('Đã xóa bài viết'); setConfirmDelete(false) },
                onError: () => toast.error('Xóa thất bại'),
              })
            }
            disabled={deletePost.isPending}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deletePost.isPending ? '...' : 'Xóa'}
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
            <FileText className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => navigate(blogEditPath(post.id))} className="gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa
          </DropdownMenuItem>
          {post.status !== 'published' && (
            <DropdownMenuItem
              onClick={() =>
                publishPost.mutate(post.id, {
                  onSuccess: () => toast.success('Đã publish bài viết'),
                  onError: () => toast.error('Publish thất bại'),
                })
              }
              disabled={publishPost.isPending}
              className="gap-2 text-green-700 focus:bg-green-50 focus:text-green-700"
            >
              <Send className="h-3.5 w-3.5" />
              Publish
            </DropdownMenuItem>
          )}
          {post.status === 'published' && (
            <DropdownMenuItem
              onClick={() =>
                unpublishPost.mutate(post.id, {
                  onSuccess: () => toast.info('Đã chuyển về draft'),
                  onError: () => toast.error('Thất bại'),
                })
              }
              disabled={unpublishPost.isPending}
              className="gap-2"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Unpublish
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
  category: BlogCategory
  onEdit: (c: BlogCategory) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteCategory = useDeleteCategory()

  if (confirmDelete) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Xóa danh mục?</span>
          <button
            onClick={() =>
              deleteCategory.mutate(category.id, {
                onSuccess: () => { toast.success('Đã xóa danh mục'); setConfirmDelete(false) },
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

// ── Column definitions ────────────────────────────────────────────────────────

function buildPostColumns(categoryMap: Map<string, string>): ColumnDef<PostRow>[] {
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
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: STATUS_OPTIONS,
      width: '120px',
      render: (value) => {
        const status = value as BlogPostStatus
        return (
          <Badge
            className={cn(
              'text-[11px] font-medium border-0',
              STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600',
            )}
          >
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )
      },
    },
    {
      key: 'categoryId',
      header: 'Danh mục',
      width: '130px',
      render: (value) => {
        const name = value ? categoryMap.get(value as string) : null
        return name ? (
          <span className="text-xs text-gray-700">{name}</span>
        ) : value ? (
          <span className="text-xs text-gray-400 font-mono">{(value as string).slice(0, 8)}…</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
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
      key: 'publishedAt',
      header: 'Published',
      sortable: true,
      width: '110px',
      className: 'text-gray-500 text-xs',
      render: (value) =>
        value
          ? new Date(value as string).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : <span className="text-gray-400">—</span>,
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
      render: (_, row) => (
        <PostActions post={row as unknown as BlogPost} />
      ),
    },
  ]
}

function buildCategoryColumns(onEdit: (c: BlogCategory) => void): ColumnDef<CategoryRow>[] {
  return [
    {
      key: 'name',
      header: 'Tên danh mục',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name as string}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.slug as string}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (value) =>
        value ? (
          <span className="text-sm text-gray-600 line-clamp-1">{value as string}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
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
        <CategoryActions category={row as unknown as BlogCategory} onEdit={onEdit} />
      ),
    },
  ]
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BlogPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts')

  // Post table
  const postTable = useDataTable<PostRow>({
    tableId: 'blog-posts',
    showSearch: true,
    searchPlaceholder: 'Tìm theo tiêu đề, nội dung...',
    showFilters: true,
    showColumnVisibility: true,
    showDensityToggle: true,
    showRefreshButton: true,
    syncToUrl: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  // Category table
  const categoryTable = useDataTable<CategoryRow>({
    tableId: 'blog-categories',
    showSearch: true,
    searchPlaceholder: 'Tìm theo tên danh mục...',
    showRefreshButton: true,
    syncToUrl: false,
    persistPageSize: true,
  })

  const {
    data: postsData,
    isLoading: postsLoading,
    isError: postsError,
    refetch: refetchPosts,
  } = useBlogPosts(postTable.buildQueryParams(['title', 'content', 'excerpt']))

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useBlogCategories(categoryTable.buildQueryParams(['name', 'description']))

  const { data: allCategoriesData } = useBlogCategoriesAll()
  const categoryMap = new Map((allCategoriesData?.data ?? []).map((c) => [c.id, c.name]))

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)

  const posts = postsData?.data ?? []
  const postsMeta = postsData?.meta
  const categories = categoriesData?.data ?? []
  const categoriesMeta = categoriesData?.meta

  const totalPublished = posts.filter((p) => p.status === 'published').length
  const totalDraft = posts.filter((p) => p.status === 'draft').length

  const postColumns = buildPostColumns(categoryMap)
  const categoryColumns = buildCategoryColumns((c) => { setEditingCategory(c); setShowCategoryModal(true) })

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Blog Management</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý bài viết và danh mục blog</p>
        </div>
        {activeTab === 'posts' ? (
          <Button
            onClick={() => navigate(ROUTES.BLOG_NEW)}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tạo bài viết
          </Button>
        ) : (
          <Button
            onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}
            className="gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tạo danh mục
          </Button>
        )}
      </div>

      {/* ── Stat cards ── */}
      {!postsError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tổng bài viết', value: postsLoading ? '—' : (postsMeta?.totalItems ?? 0), icon: FileText },
            { label: 'Published', value: postsLoading ? '—' : totalPublished, icon: Send },
            { label: 'Draft', value: postsLoading ? '—' : totalDraft, icon: Pencil },
            { label: 'Danh mục', value: categoriesLoading ? '—' : (categoriesMeta?.totalItems ?? 0), icon: Archive },
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'categories')}>
        <TabsList className="h-9">
          <TabsTrigger value="posts" className="gap-2 px-4 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Bài viết
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2 px-4 text-sm">
            <FolderOpen className="h-3.5 w-3.5" />
            Danh mục
          </TabsTrigger>
        </TabsList>

        {/* ── Posts tab ── */}
        <TabsContent value="posts" className="mt-4">
          {postsError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách bài viết. Vui lòng thử lại.
            </div>
          ) : (
            <DataTable<PostRow>
              columns={postColumns}
              data={posts as PostRow[]}
              loading={postsLoading}
              rowKey="id"
              emptyText="Chưa có bài viết nào"
              table={postTable}
              total={postsMeta?.totalItems}
              onRefresh={refetchPosts}
            />
          )}
        </TabsContent>

        {/* ── Categories tab ── */}
        <TabsContent value="categories" className="mt-4">
          {categoriesError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Không thể tải danh sách danh mục. Vui lòng thử lại.
            </div>
          ) : (
            <DataTable<CategoryRow>
              columns={categoryColumns}
              data={categories as CategoryRow[]}
              loading={categoriesLoading}
              rowKey="id"
              emptyText="Chưa có danh mục nào"
              table={categoryTable}
              total={categoriesMeta?.totalItems}
              onRefresh={refetchCategories}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <BlogCategoryModal
        open={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null) }}
        editingCategory={editingCategory}
      />
    </div>
  )
}
