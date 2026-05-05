import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFormContext, Controller, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Settings2,
  Save,
  Loader2,
  Image,
  X,
  FileText,
  Code2,
  AlignLeft,
  Braces,
  Search,
} from 'lucide-react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import MarkdownPreview from '@uiw/react-markdown-preview'
import '@uiw/react-md-editor/markdown-editor.css'

import { Button } from '@shared/components/ui/button'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog'
import { cn } from '@shared/utils'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { ROUTES, blogEditPath } from '@config/routes'
import { MediaPicker, useMediaFile } from '@modules/media'
import type { MediaFile } from '@modules/media'
import { useConfigs } from '@modules/config'
import { useGetPost, useCreatePost, useUpdatePost } from '../hooks/useBlogPosts'
import { useBlogCategories } from '../hooks/useBlogCategories'
import { TagInput } from './TagInput'

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bắt buộc').max(500),
  slug: z.string().optional(),
  content: z.string().default(''),
  contentType: z.enum(['markdown', 'html', 'plain']).default('markdown'),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  coverFileId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Content type options ──────────────────────────────────────────────────────

const CONTENT_TYPES = [
  {
    value: 'markdown' as const,
    label: 'Markdown',
    icon: FileText,
    hint: 'Editor với toolbar & live preview',
  },
  {
    value: 'html' as const,
    label: 'HTML',
    icon: Code2,
    hint: 'Viết HTML trực tiếp',
  },
  {
    value: 'plain' as const,
    label: 'Plain text',
    icon: AlignLeft,
    hint: 'Văn bản thuần không định dạng',
  },
]

// ── Config Picker Dialog ──────────────────────────────────────────────────────

function ConfigPickerDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (key: string) => void
}) {
  const [search, setSearch] = useState('')
  const { data } = useConfigs({ page: 1, limit: 200 } as NestjsPaginateParams)

  const configs = useMemo(() => {
    if (!data?.data) return []
    const q = search.toLowerCase()
    return data.data.filter(
      (c) =>
        c.key.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q),
    )
  }, [data, search])

  const getValuePreview = (val: unknown): string => {
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    return JSON.stringify(val)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chèn biến config</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm config..."
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
            {configs.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Không tìm thấy config</p>
            ) : (
              configs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.key)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors group"
                >
                  <Braces className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-medium text-gray-800 truncate">
                      {`{{${c.key}}}`}
                    </p>
                    {c.description && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.description}</p>
                    )}
                    <p className="text-[10px] text-blue-500 truncate mt-0.5">
                      → {getValuePreview(c.value)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <p className="text-[10px] text-gray-400">
            Click để chèn <code className="bg-gray-100 px-1 rounded">{'{{key}}'}</code> tại vị trí con trỏ.
            Khi render, biến sẽ được thay bằng giá trị config.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Settings Sidebar ──────────────────────────────────────────────────────────

function SettingsSidebar({
  categories,
  width,
}: {
  categories: { id: string; name: string }[]
  width: number
}) {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext<FormValues>()
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  const coverFileId = watch('coverFileId')
  const { data: coverFile } = useMediaFile(coverFileId || null)

  return (
    <aside
      style={{ width }}
      className="shrink-0 overflow-y-auto bg-white"
    >
      <div className="p-5 space-y-5">

        {/* ── Title ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Tiêu đề</label>
          <Textarea
            value={watch('title') ?? ''}
            onChange={(e) => setValue('title', e.target.value, { shouldDirty: true, shouldValidate: true })}
            placeholder="Tiêu đề bài viết..."
            rows={2}
            className="resize-none text-sm font-semibold leading-snug"
          />
          {errors.title && (
            <p className="text-[10px] text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* ── Content type ── */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Định dạng nội dung
          </p>
          <Controller
            control={control}
            name="contentType"
            render={({ field }) => (
              <div className="space-y-1.5">
                {CONTENT_TYPES.map(({ value, label, icon: Icon, hint }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      field.value === value
                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-tight">{label}</p>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{hint}</p>
                    </div>
                    {field.value === value && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-900 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Cài đặt bài viết
          </p>

          {/* ── Status ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Trạng thái</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* ── Cover image ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Ảnh bìa</label>
            {coverFile ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={coverFile.thumbnailUrl ?? coverFile.url}
                  alt={coverFile.filename}
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setValue('coverFileId', '')}
                  className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
                <div className="p-1.5">
                  <p className="text-[10px] text-gray-500 truncate">{coverFile.filename}</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMediaPicker(true)}
                className="w-full flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-100"
              >
                <Image className="h-5 w-5" />
                <span className="text-[11px]">Chọn ảnh từ thư viện</span>
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs gap-1.5"
              onClick={() => setShowMediaPicker(true)}
            >
              <Image className="h-3 w-3" />
              {coverFile ? 'Thay ảnh bìa' : 'Chọn ảnh bìa'}
            </Button>
          </div>

          {/* ── Slug ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Slug</label>
            <Input
              {...register('slug')}
              placeholder="tu-dong-tao-tu-tieu-de"
              className="h-8 font-mono text-xs"
            />
            <p className="text-[10px] text-gray-400">Để trống để tự động tạo từ tiêu đề</p>
          </div>

          {/* ── Category ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Danh mục</label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value ?? '__none__'} onValueChange={field.onChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Chọn danh mục..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không có danh mục</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* ── Tags ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Tags</label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* ── Excerpt ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Tóm tắt (excerpt)</label>
            <Textarea
              {...register('excerpt')}
              placeholder="Tóm tắt ngắn hiển thị trên danh sách..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>

        {/* ── SEO ── */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">SEO</p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Meta Title</label>
            <Input {...register('metaTitle')} placeholder="Tiêu đề SEO..." className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Meta Description</label>
            <Textarea
              {...register('metaDesc')}
              placeholder="Mô tả SEO..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Cover image media picker */}
      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(file) => {
          setValue('coverFileId', file.id)
          setShowMediaPicker(false)
        }}
      />
    </aside>
  )
}

// ── Editor area ───────────────────────────────────────────────────────────────

const HEADER_H = 57

function EditorArea() {
  const { watch, setValue } = useFormContext<FormValues>()
  const content = watch('content')
  const contentType = watch('contentType')

  const [showInsertMedia, setShowInsertMedia] = useState(false)
  const [showInsertConfig, setShowInsertConfig] = useState(false)

  // MDEditor TextAPI ref — captured when toolbar command fires
  const mdApiRef = useRef<{ replaceSelection: (text: string) => void } | null>(null)
  // Textarea ref for html/plain cursor insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Build config map for variable substitution in preview
  const { data: configsData } = useConfigs({ page: 1, limit: 500 } as NestjsPaginateParams)
  const configMap = useMemo<Record<string, string>>(() => {
    if (!configsData?.data) return {}
    return Object.fromEntries(
      configsData.data.map((c) => [
        c.key,
        typeof c.value === 'string' ? c.value : JSON.stringify(c.value),
      ]),
    )
  }, [configsData])

  // Content with {{key}} replaced by actual config values (for preview)
  const processedContent = useMemo(
    () => content.replace(/\{\{([^}]+)\}\}/g, (_, key) => configMap[key.trim()] ?? `{{${key}}}`),
    [content, configMap],
  )

  // Insert text at cursor in plain/html textarea
  const insertAtCursor = (text: string) => {
    const el = textareaRef.current
    if (!el) {
      setValue('content', content + text, { shouldDirty: true })
      return
    }
    const { selectionStart: start, selectionEnd: end } = el
    const next = content.slice(0, start) + text + content.slice(end)
    setValue('content', next, { shouldDirty: true })
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length
      el.focus()
    })
  }

  const handleInsertMedia = (file: MediaFile) => {
    if (contentType === 'markdown') {
      const text = `![${file.alt ?? file.filename}](${file.url})`
      if (mdApiRef.current) {
        mdApiRef.current.replaceSelection(text)
      } else {
        setValue('content', content + text, { shouldDirty: true })
      }
    } else if (contentType === 'html') {
      insertAtCursor(`<img src="${file.url}" alt="${file.alt ?? file.filename}" />`)
    } else {
      insertAtCursor(file.url)
    }
    setShowInsertMedia(false)
  }

  const handleInsertConfig = (key: string) => {
    const text = `{{${key}}}`
    if (contentType === 'markdown' && mdApiRef.current) {
      mdApiRef.current.replaceSelection(text)
    } else {
      insertAtCursor(text)
    }
    setShowInsertConfig(false)
  }

  // Custom MDEditor toolbar commands
  const extraCommands = useMemo(
    () => [
      commands.divider,
      {
        name: 'insertMedia',
        keyCommand: 'insertMedia',
        buttonProps: { title: 'Chèn ảnh từ thư viện', 'aria-label': 'Chèn ảnh' },
        icon: <Image className="h-3 w-3" />,
        execute: (_state: unknown, api: { replaceSelection: (text: string) => void }) => {
          mdApiRef.current = api
          setShowInsertMedia(true)
        },
      },
      {
        name: 'insertConfig',
        keyCommand: 'insertConfig',
        buttonProps: { title: 'Chèn biến config', 'aria-label': 'Chèn config' },
        icon: <Braces className="h-3 w-3" />,
        execute: (_state: unknown, api: { replaceSelection: (text: string) => void }) => {
          mdApiRef.current = api
          setShowInsertConfig(true)
        },
      },
    ],
    [],
  )

  const dialogs = (
    <>
      <MediaPicker
        open={showInsertMedia}
        onClose={() => setShowInsertMedia(false)}
        onSelect={handleInsertMedia}
      />
      <ConfigPickerDialog
        open={showInsertConfig}
        onClose={() => setShowInsertConfig(false)}
        onSelect={handleInsertConfig}
      />
    </>
  )

  // ── Markdown: split edit / preview panes ──────────────────────────────────

  if (contentType === 'markdown') {
    return (
      <div className="flex-1 overflow-hidden flex" data-color-mode="light">
        {/* Edit pane */}
        <div className="flex-1 overflow-hidden">
          <MDEditor
            value={content}
            onChange={(val) => setValue('content', val ?? '', { shouldDirty: true })}
            height={`calc(100vh - ${HEADER_H}px)`}
            preview="edit"
            visibleDragbar={false}
            extraCommands={extraCommands}
          />
        </div>

        {/* Preview pane with config substitution */}
        <div className="flex-1 overflow-y-auto border-l border-gray-200 bg-white">
          <div className="px-8 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-4">
              Preview
            </p>
            <div className="prose prose-sm max-w-none">
              <MarkdownPreview source={processedContent} wrapperElement={{ 'data-color-mode': 'light' }} />
            </div>
          </div>
        </div>

        {dialogs}
      </div>
    )
  }

  // ── HTML / Plain: single pane with custom toolbar ─────────────────────────

  const isHtml = contentType === 'html'

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div
        className={cn(
          'flex items-center gap-1.5 border-b px-4 py-1.5 shrink-0',
          isHtml ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200',
        )}
      >
        {isHtml ? (
          <Code2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <AlignLeft className="h-3.5 w-3.5 text-gray-500" />
        )}
        <span className={cn('text-xs font-medium mr-3', isHtml ? 'text-green-400' : 'text-gray-500')}>
          {isHtml ? 'HTML Editor' : 'Plain Text Editor'}
        </span>

        <div className={cn('h-4 w-px shrink-0', isHtml ? 'bg-gray-700' : 'bg-gray-300')} />

        <button
          type="button"
          onClick={() => setShowInsertMedia(true)}
          title="Chèn ảnh từ thư viện"
          className={cn(
            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            isHtml
              ? 'text-gray-400 hover:text-green-400 hover:bg-gray-900'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200',
          )}
        >
          <Image className="h-3 w-3" />
          Chèn ảnh
        </button>

        <button
          type="button"
          onClick={() => setShowInsertConfig(true)}
          title="Chèn biến config"
          className={cn(
            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            isHtml
              ? 'text-gray-400 hover:text-green-400 hover:bg-gray-900'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200',
          )}
        >
          <Braces className="h-3 w-3" />
          Chèn biến
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setValue('content', e.target.value, { shouldDirty: true })}
        className={cn(
          'flex-1 w-full resize-none outline-none p-5 text-sm leading-relaxed',
          isHtml
            ? 'font-mono text-xs bg-gray-950 text-green-400 placeholder:text-gray-700'
            : 'bg-white text-gray-900 placeholder:text-gray-300',
        )}
        placeholder={
          isHtml
            ? '<article>\n  <p>Nội dung HTML...</p>\n</article>'
            : 'Bắt đầu viết nội dung...'
        }
        spellCheck={!isHtml}
      />

      {dialogs}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BlogPostEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [showSettings, setShowSettings] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(288)
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

  const { data: post, isLoading: postLoading } = useGetPost(id)
  const { data: categoriesData } = useBlogCategories({ page: 1, limit: 200 } as NestjsPaginateParams)
  const categories = categoriesData?.data ?? []

  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const isPending = createPost.isPending || updatePost.isPending

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      contentType: 'markdown',
      tags: [],
      status: 'draft',
      categoryId: '__none__',
    },
  })

  const { register, handleSubmit, reset, getValues, formState: { errors, isDirty } } = methods

  const DRAFT_KEY = `blog_draft_${id ?? 'new'}`

  // Track state in refs (safe for cleanup closures)
  const isDirtyRef = useRef(isDirty)
  const skipDraftSave = useRef(false)
  // After restoring a draft, reset() sets isDirty=false — use this ref so
  // the cleanup effect still saves on the next navigate-away
  const draftWasRestored = useRef(false)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const [localDraft, setLocalDraft] = useState<(FormValues & { _savedAt?: number }) | null>(null)
  const draftChecked = useRef(false)

  const hasMeaningfulContent = (values: FormValues) =>
    !!values.title?.trim() || !!values.content?.trim()

  // Restore post data into form when loaded
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        contentType: post.contentType ?? 'markdown',
        excerpt: post.excerpt ?? '',
        status: post.status,
        categoryId: post.categoryId ?? '__none__',
        tags: post.tags,
        coverFileId: post.coverFileId ?? '',
        metaTitle: post.metaTitle ?? '',
        metaDesc: post.metaDesc ?? '',
      })
    }
  }, [post, reset])

  // Check localStorage for a saved draft after post data is available
  useEffect(() => {
    if (draftChecked.current) return
    if (isEdit && postLoading) return
    draftChecked.current = true

    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as FormValues & { _savedAt?: number }
      // Discard drafts that have no meaningful content
      if (!hasMeaningfulContent(draft)) {
        localStorage.removeItem(DRAFT_KEY)
        return
      }
      setLocalDraft(draft)
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [DRAFT_KEY, isEdit, postLoading])

  // Auto-save to localStorage on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      const shouldSave = (isDirtyRef.current || draftWasRestored.current) && !skipDraftSave.current
      if (shouldSave) {
        const values = getValues()
        if (hasMeaningfulContent(values)) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, _savedAt: Date.now() }))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAFT_KEY])

  const restoreDraft = () => {
    if (!localDraft) return
    const { _savedAt: _, ...values } = localDraft
    reset(values as FormValues)
    draftWasRestored.current = true  // ensure next unmount re-saves
    localStorage.removeItem(DRAFT_KEY)
    setLocalDraft(null)
    toast.success('Đã khôi phục bản nháp')
  }

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setLocalDraft(null)
  }

  const buildPayload = (values: FormValues) => ({
    ...values,
    slug: values.slug || undefined,
    excerpt: values.excerpt || undefined,
    categoryId: values.categoryId === '__none__' ? undefined : values.categoryId,
    coverFileId: values.coverFileId || undefined,
    metaTitle: values.metaTitle || undefined,
    metaDesc: values.metaDesc || undefined,
  })

  const onSave = handleSubmit((values) => {
    const payload = buildPayload(values)

    if (isEdit && id) {
      updatePost.mutate(
        { id, dto: payload },
        {
          onSuccess: () => {
            skipDraftSave.current = true
            localStorage.removeItem(DRAFT_KEY)
            toast.success('Đã lưu thay đổi')
          },
          onError: () => toast.error('Lưu thất bại'),
        },
      )
    } else {
      createPost.mutate(payload, {
        onSuccess: (res) => {
          skipDraftSave.current = true
          localStorage.removeItem(DRAFT_KEY)
          toast.success('Đã tạo bài viết')
          navigate(blogEditPath(res.postId))
        },
        onError: () => toast.error('Tạo thất bại. Slug có thể đã tồn tại.'),
      })
    }
  })

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-screen bg-white">
        {/* ── Header ── */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 z-10">
          <button
            onClick={() => navigate(ROUTES.BLOG)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Bài viết</span>
          </button>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          <input
            {...register('title')}
            placeholder="Tiêu đề bài viết..."
            className="flex-1 text-base font-semibold bg-transparent outline-none placeholder:text-gray-300 text-gray-900 min-w-0"
          />

          {errors.title && (
            <span className="text-xs text-red-500 shrink-0">{errors.title.message}</span>
          )}

          <div className="flex items-center gap-2 shrink-0">
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
          {isEdit && postLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <EditorArea />
          )}

          {showSettings && (
            <>
              {/* Drag-to-resize handle */}
              <div
                onMouseDown={handleResizeStart}
                className="w-1 shrink-0 cursor-col-resize bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors"
              />
              <SettingsSidebar categories={categories} width={sidebarWidth} />
            </>
          )}
        </div>
      </div>
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
    </FormProvider>
  )
}
