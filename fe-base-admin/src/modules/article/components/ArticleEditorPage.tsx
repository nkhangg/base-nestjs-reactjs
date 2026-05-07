import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Settings2,
  Save,
  Loader2,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Braces,
  RotateCcw,
  WrapText,
} from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

import { Button } from '@shared/components/ui/button'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { Input } from '@shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { Badge } from '@shared/components/ui/badge'
import { cn } from '@shared/utils'
import { ROUTES, articleEditPath } from '@config/routes'
import { useArticle, useCreateArticle, useUpdateArticle, useApproveArticle, useRejectArticle } from '../hooks/useArticle'
import { useCategoryList, useTagList } from '../hooks/useArticleTaxonomy'
import { ArticleTagModal } from './ArticleTagModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(str: string): string {
  const ascii = str
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '')
  return ascii || `article-${Date.now()}`
}

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bắt buộc').max(500),
  slug: z.string().min(1, 'Slug bắt buộc'),
  contentRaw: z.string().default(''),
  contentAnnotatedJson: z.string().default(''),
  level: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof formSchema>

type EditorMode = 'markdown' | 'json'

// ── Level options ─────────────────────────────────────────────────────────────

const LEVELS = [
  { value: '1', label: 'N1 — Khó nhất' },
  { value: '2', label: 'N2' },
  { value: '3', label: 'N3' },
  { value: '4', label: 'N4' },
  { value: '5', label: 'N5 — Dễ nhất' },
]

// ── Settings Sidebar ──────────────────────────────────────────────────────────

function SettingsSidebar({
  width,
  onAddTag,
}: {
  width: number
  onAddTag: () => void
}) {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<FormValues>()
  const { data: categoriesData } = useCategoryList()
  const { data: tagsData } = useTagList()
  const categories = categoriesData?.data ?? []
  const tags = tagsData?.data ?? []

  const [tagSearch, setTagSearch] = useState('')

  const selectedCategoryIds = watch('categoryIds') ?? []
  const selectedTagIds = watch('tagIds') ?? []

  const toggleCategory = (id: string) => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id]
    setValue('categoryIds', next, { shouldDirty: true })
  }

  const toggleTag = (id: string) => {
    const next = selectedTagIds.includes(id)
      ? selectedTagIds.filter((t) => t !== id)
      : [...selectedTagIds, id]
    setValue('tagIds', next, { shouldDirty: true })
  }

  const filteredTags = tagSearch
    ? tags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : tags

  return (
    <aside style={{ width }} className="shrink-0 overflow-y-auto bg-white">
      <div className="p-5 space-y-5">

        {/* ── Title ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Tiêu đề</label>
          <textarea
            {...register('title')}
            rows={2}
            placeholder="Tiêu đề bài đọc..."
            className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-semibold leading-snug outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 transition-colors placeholder:text-muted-foreground"
            onChange={(e) => {
              const val = e.target.value
              setValue('title', val, { shouldDirty: true, shouldValidate: true })
              const currentSlug = watch('slug')
              if (!currentSlug || currentSlug.startsWith('article-')) {
                setValue('slug', toSlug(val), { shouldDirty: true })
              }
            }}
          />
          {errors.title && (
            <p className="text-[10px] text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* ── Slug ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Slug <span className="text-red-400">*</span></label>
          <Input
            {...register('slug')}
            placeholder="tieu-de-bai-doc"
            className="h-8 font-mono text-xs"
          />
          {errors.slug && (
            <p className="text-[10px] text-red-500">{errors.slug.message}</p>
          )}
          <p className="text-[10px] text-gray-400">Tự động tạo từ tiêu đề, có thể chỉnh sửa</p>
        </div>

        {/* ── JLPT Level ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Cấp độ JLPT</label>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select value={field.value ?? '__none__'} onValueChange={field.onChange}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Chọn cấp độ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Không xác định</SelectItem>
                  {LEVELS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* ── Categories ── */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Chủ đề</p>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400">Chưa có chủ đề nào</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const selected = selectedCategoryIds.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                      selected
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {cat.colorCode ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: cat.colorCode }}
                      />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300" />
                    )}
                    <span className="flex-1 truncate">{cat.name}</span>
                    {selected && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {selectedCategoryIds.length > 0 && (
            <p className="text-[10px] text-gray-400">{selectedCategoryIds.length} chủ đề đã chọn</p>
          )}
        </div>

        {/* ── Tags ── */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Tags</p>
            <button
              type="button"
              onClick={onAddTag}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Thêm tag
            </button>
          </div>

          {/* Selected tags */}
          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedTagIds.map((id) => {
                const tag = tags.find((t) => t.id === id)
                return tag ? (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => toggleTag(id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}

          {/* Tag search + select */}
          <Input
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Tìm tag..."
            className="h-7 text-xs"
          />
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {filteredTags
              .filter((t) => !selectedTagIds.includes(t.id))
              .map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            {filteredTags.filter((t) => !selectedTagIds.includes(t.id)).length === 0 && (
              <p className="text-xs text-gray-400 py-1">
                {tagSearch ? 'Không tìm thấy tag' : 'Tất cả tags đã được chọn'}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── JSON Editor Pane ──────────────────────────────────────────────────────────

const JSON_PLACEHOLDER = `{
  "tokens": [],
  "sentences": []
}`

function JsonEditorPane() {
  const { watch, setValue } = useFormContext<FormValues>()
  const value = watch('contentAnnotatedJson')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isEmpty = !value.trim()

  const validate = (str: string) => {
    const trimmed = str.trim()
    if (!trimmed || trimmed === 'null') { setError(null); return }
    try { JSON.parse(trimmed); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'JSON không hợp lệ') }
  }

  const handleFormat = () => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === 'null') return
    try {
      const pretty = JSON.stringify(JSON.parse(trimmed), null, 2)
      setValue('contentAnnotatedJson', pretty, { shouldDirty: true })
      setError(null)
    } catch {
      // already invalid — do nothing, error is shown inline
    }
  }

  const handleReset = () => {
    setValue('contentAnnotatedJson', '', { shouldDirty: true })
    setError(null)
    setFocused(false)
  }

  const focusEditor = () => {
    setFocused(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-800 px-4 py-2">
        <Braces className="h-3.5 w-3.5 text-green-500 shrink-0" />
        <span className="text-xs font-medium text-green-400">contentAnnotated</span>

        {error ? (
          <span className="ml-2 truncate text-[10px] text-red-400 flex-1">{error}</span>
        ) : (
          <span className="flex-1" />
        )}

        <button
          type="button"
          onClick={handleFormat}
          disabled={isEmpty || value.trim() === 'null'}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-gray-400 hover:bg-gray-800 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <WrapText className="h-3 w-3" />
          Format
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isEmpty}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset về null
        </button>
      </div>

      {/* Empty-state overlay */}
      {isEmpty && !focused ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <Braces className="h-6 w-6 text-gray-600" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-medium text-gray-400">Chưa có dữ liệu tokenize</p>
            <p className="text-xs text-gray-600 max-w-xs">
              Field <code className="rounded bg-gray-800 px-1 py-px text-green-500">contentAnnotated</code> chưa
              được điền. Để trống để lưu <code className="rounded bg-gray-800 px-1 py-px text-gray-400">null</code>,
              hoặc nhập JSON tokenized thủ công.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={focusEditor}
              className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-xs font-medium text-gray-300 hover:border-green-700 hover:bg-gray-800 hover:text-green-400 transition-colors"
            >
              <Braces className="h-3.5 w-3.5" />
              Nhập JSON
            </button>
            <p className="text-[10px] text-gray-700">Để trống khi lưu = giữ null</p>
          </div>
          {/* Greyed-out JSON structure hint */}
          <pre className="w-full max-w-xs rounded-lg border border-gray-800 bg-gray-900 p-3 text-[10px] leading-relaxed text-gray-700 select-none">
            {JSON_PLACEHOLDER}
          </pre>
        </div>
      ) : (
        /* Editor textarea */
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue('contentAnnotatedJson', e.target.value, { shouldDirty: true })
            validate(e.target.value)
          }}
          onBlur={() => { if (!value.trim()) setFocused(false) }}
          spellCheck={false}
          autoFocus={focused}
          className={cn(
            'flex-1 w-full resize-none outline-none p-5 font-mono text-xs leading-relaxed bg-gray-950 placeholder:text-gray-700 transition-colors',
            error ? 'text-red-300' : 'text-green-300',
          )}
          placeholder={JSON_PLACEHOLDER}
        />
      )}
    </div>
  )
}

// ── Markdown Editor Area ──────────────────────────────────────────────────────

const HEADER_H = 57

function EditorArea({ mode }: { mode: EditorMode }) {
  const { watch, setValue } = useFormContext<FormValues>()
  const contentRaw = watch('contentRaw')

  if (mode === 'json') {
    return <JsonEditorPane />
  }

  return (
    <div className="flex-1 overflow-hidden" data-color-mode="light">
      <MDEditor
        value={contentRaw}
        onChange={(val) => setValue('contentRaw', val ?? '', { shouldDirty: true })}
        height={`calc(100vh - ${HEADER_H}px)`}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [showSettings, setShowSettings] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(288)
  const [showTagModal, setShowTagModal] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('markdown')
  const isResizing = useRef(false)

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const next = Math.min(600, Math.max(200, startWidth + startX - ev.clientX))
      setSidebarWidth(next)
    }
    const onMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const { data: article, isLoading: articleLoading } = useArticle(id)
  const createArticle = useCreateArticle()
  const updateArticle = useUpdateArticle()
  const approveArticle = useApproveArticle()
  const rejectArticle = useRejectArticle()
  const isPending = createArticle.isPending || updateArticle.isPending

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      contentRaw: '',
      contentAnnotatedJson: '',
      level: '__none__',
      categoryIds: [],
      tagIds: [],
    },
  })

  const { register, handleSubmit, reset, getValues, watch: watchForm, formState: { errors, isDirty } } = methods

  const DRAFT_KEY = `article_draft_${id ?? 'new'}`
  const isDirtyRef = useRef(isDirty)
  const skipDraftSave = useRef(false)
  const draftWasRestored = useRef(false)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const [localDraft, setLocalDraft] = useState<(FormValues & { _savedAt?: number }) | null>(null)
  const draftChecked = useRef(false)

  const hasMeaningfulContent = (values: FormValues) =>
    !!values.title?.trim() || !!values.contentRaw?.trim()

  // Restore article data when loaded
  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        slug: article.slug,
        contentRaw: article.contentRaw,
        contentAnnotatedJson: article.contentAnnotated
          ? JSON.stringify(article.contentAnnotated, null, 2)
          : '',
        level: article.level ? String(article.level) : '__none__',
        categoryIds: article.categoryIds ?? [],
        tagIds: article.tagIds ?? [],
      })
    }
  }, [article, reset])

  // Check localStorage for draft
  useEffect(() => {
    if (draftChecked.current) return
    if (isEdit && articleLoading) return
    draftChecked.current = true

    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as FormValues & { _savedAt?: number }
      if (!hasMeaningfulContent(draft)) {
        localStorage.removeItem(DRAFT_KEY)
        return
      }
      setLocalDraft(draft)
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [DRAFT_KEY, isEdit, articleLoading])

  // Auto-save on unmount — exclude contentAnnotatedJson to avoid localStorage overflow
  useEffect(() => {
    return () => {
      const shouldSave = (isDirtyRef.current || draftWasRestored.current) && !skipDraftSave.current
      if (shouldSave) {
        const { contentAnnotatedJson: _excluded, ...draftValues } = getValues()
        if (hasMeaningfulContent(draftValues as FormValues)) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draftValues, _savedAt: Date.now() }))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAFT_KEY])

  const restoreDraft = () => {
    if (!localDraft) return
    const { _savedAt: _, ...values } = localDraft
    reset(values as FormValues)
    draftWasRestored.current = true
    localStorage.removeItem(DRAFT_KEY)
    setLocalDraft(null)
    toast.success('Đã khôi phục bản nháp')
  }

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setLocalDraft(null)
  }

  const onSave = handleSubmit((values) => {
    // Parse contentAnnotatedJson
    let contentAnnotated: Record<string, unknown> | null | undefined = undefined
    const jsonStr = values.contentAnnotatedJson.trim()
    if (jsonStr && jsonStr !== 'null') {
      try {
        contentAnnotated = JSON.parse(jsonStr) as Record<string, unknown>
      } catch {
        toast.error('JSON không hợp lệ — vui lòng kiểm tra lại')
        setEditorMode('json')
        return
      }
    } else if (isEdit) {
      // Edit mode: explicitly null → clear tokenized data
      contentAnnotated = null
    }

    const payload = {
      title: values.title,
      slug: values.slug,
      contentRaw: values.contentRaw,
      level: values.level && values.level !== '__none__' ? parseInt(values.level, 10) : undefined,
      categoryIds: values.categoryIds.length > 0 ? values.categoryIds : undefined,
      tagIds: values.tagIds.length > 0 ? values.tagIds : undefined,
      ...(contentAnnotated !== undefined ? { contentAnnotated } : {}),
    }

    if (isEdit && id) {
      updateArticle.mutate(
        { id, dto: payload },
        {
          onSuccess: () => {
            skipDraftSave.current = true
            localStorage.removeItem(DRAFT_KEY)
            toast.success('Đã lưu thay đổi')
          },
          onError: () => toast.error('Lưu thất bại. Slug có thể đã tồn tại.'),
        },
      )
    } else {
      createArticle.mutate(payload, {
        onSuccess: (res) => {
          skipDraftSave.current = true
          localStorage.removeItem(DRAFT_KEY)
          toast.success('Đã tạo bài đọc')
          navigate(articleEditPath(res.articleId))
        },
        onError: () => toast.error('Tạo thất bại. Slug có thể đã tồn tại.'),
      })
    }
  })

  const articleStatus = isEdit ? article?.status : undefined
  const hasAnnotated = isEdit && article !== undefined && article.contentAnnotated !== null

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-screen bg-white">
        {/* ── Header ── */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 z-10">
          <button
            onClick={() => navigate(ROUTES.ARTICLES)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Bài đọc</span>
          </button>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          <input
            {...register('title')}
            placeholder="Tiêu đề bài đọc..."
            className="flex-1 text-base font-semibold bg-transparent outline-none placeholder:text-gray-300 text-gray-900 min-w-0"
            onChange={(e) => {
              const val = e.target.value
              methods.setValue('title', val, { shouldDirty: true, shouldValidate: true })
              const currentSlug = watchForm('slug')
              if (!currentSlug || currentSlug.startsWith('article-')) {
                methods.setValue('slug', toSlug(val), { shouldDirty: true })
              }
            }}
          />

          {errors.title && (
            <span className="text-xs text-red-500 shrink-0">{errors.title.message}</span>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            {articleStatus && (
              <Badge
                className={cn('text-[11px] font-medium border-0', {
                  'bg-yellow-100 text-yellow-700': articleStatus === 'pending',
                  'bg-blue-100 text-blue-700': articleStatus === 'approved',
                  'bg-red-100 text-red-600': articleStatus === 'rejected',
                  'bg-green-100 text-green-700': articleStatus === 'published',
                })}
              >
                {{ pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', published: 'Đã xuất bản' }[articleStatus]}
              </Badge>
            )}

            {/* Moderation actions */}
            {articleStatus === 'pending' && id && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                  onClick={() =>
                    approveArticle.mutate(id, {
                      onSuccess: () => toast.success('Đã phê duyệt bài đọc'),
                      onError: () => toast.error('Phê duyệt thất bại'),
                    })
                  }
                  isLoading={approveArticle.isPending}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Duyệt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() =>
                    rejectArticle.mutate(id, {
                      onSuccess: () => toast.info('Đã từ chối bài đọc'),
                      onError: () => toast.error('Từ chối thất bại'),
                    })
                  }
                  isLoading={rejectArticle.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Từ chối
                </Button>
              </>
            )}

            {/* ── Editor mode toggle ── */}
            <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setEditorMode('markdown')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium transition-colors',
                  editorMode === 'markdown'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                )}
              >
                Markdown
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('json')}
                className={cn(
                  'flex items-center gap-1.5 border-l border-gray-200 px-2.5 py-1.5 text-xs font-medium transition-colors',
                  editorMode === 'json'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                )}
              >
                <Braces className="h-3 w-3" />
                JSON
                {/* Show "null" badge when contentAnnotated is not set */}
                {isEdit && !hasAnnotated && (
                  <span
                    className={cn(
                      'rounded px-1 py-px text-[9px] font-semibold leading-none',
                      editorMode === 'json'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-yellow-100 text-yellow-700',
                    )}
                  >
                    null
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                showSettings
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Settings</span>
            </button>

            <Button onClick={onSave} isLoading={isPending} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {isEdit ? 'Lưu' : 'Tạo'}
            </Button>
          </div>
        </header>

        {/* ── Main ── */}
        <div className="flex flex-1 overflow-hidden">
          {isEdit && articleLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <EditorArea mode={editorMode} />
          )}

          {showSettings && (
            <>
              <div
                onMouseDown={handleResizeStart}
                className="w-1 shrink-0 cursor-col-resize bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors"
              />
              <SettingsSidebar
                width={sidebarWidth}
                onAddTag={() => setShowTagModal(true)}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Draft restore dialog ── */}
      <ConfirmDialog
        open={!!localDraft}
        onClose={discardDraft}
        onConfirm={restoreDraft}
        title="Khôi phục bản nháp?"
        description={`Bạn có nội dung chưa lưu từ ${localDraft?._savedAt ? new Date(localDraft._savedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'trước đó'}. Bạn có muốn khôi phục không?`}
        confirmLabel="Khôi phục"
        cancelLabel="Bỏ qua"
        variant="info"
      />

      {/* ── Tag creation modal ── */}
      <ArticleTagModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreated={(tagId) => {
          const current = methods.getValues('tagIds')
          methods.setValue('tagIds', [...current, tagId], { shouldDirty: true })
        }}
      />
    </FormProvider>
  )
}
