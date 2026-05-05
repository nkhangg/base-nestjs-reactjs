import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { useCreatePost, useUpdatePost } from '../hooks/useBlogPosts'
import { useBlogCategories } from '../hooks/useBlogCategories'
import { TagInput } from './TagInput'
import type { BlogPost } from '../types'

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, 'Bắt buộc').max(500, 'Tối đa 500 ký tự'),
  slug: z.string().optional(),
  content: z.string().min(1, 'Bắt buộc'),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  coverFileId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── FormField ─────────────────────────────────────────────────────────────────

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel className="text-sm font-medium text-gray-700">{label}</FieldLabel>
      {children}
      {error && <FieldError className="text-xs">{error}</FieldError>}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface BlogPostModalProps {
  open: boolean
  onClose: () => void
  editingPost?: BlogPost | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogPostModal({ open, onClose, editingPost }: BlogPostModalProps) {
  const isEdit = !!editingPost
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const isPending = createPost.isPending || updatePost.isPending
  const isError = createPost.isError || updatePost.isError

  const { data: categoriesData } = useBlogCategories({ page: 1, limit: 200 })
  const categories = categoriesData?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { tags: [] } })

  useEffect(() => {
    if (open) {
      if (editingPost) {
        reset({
          title: editingPost.title,
          slug: editingPost.slug,
          content: editingPost.content,
          excerpt: editingPost.excerpt ?? '',
          status: editingPost.status,
          categoryId: editingPost.categoryId ?? '__none__',
          tags: editingPost.tags,
          coverFileId: editingPost.coverFileId ?? '',
          metaTitle: editingPost.metaTitle ?? '',
          metaDesc: editingPost.metaDesc ?? '',
        })
      } else {
        reset({ title: '', slug: '', content: '', excerpt: '', status: 'draft', categoryId: '__none__', tags: [], coverFileId: '', metaTitle: '', metaDesc: '' })
      }
    }
  }, [open, editingPost, reset])

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      slug: values.slug || undefined,
      content: values.content,
      excerpt: values.excerpt || undefined,
      status: values.status,
      categoryId: values.categoryId === '__none__' ? undefined : values.categoryId,
      tags: values.tags,
      coverFileId: values.coverFileId || undefined,
      metaTitle: values.metaTitle || undefined,
      metaDesc: values.metaDesc || undefined,
    }

    if (isEdit && editingPost) {
      updatePost.mutate(
        { id: editingPost.id, dto: payload },
        {
          onSuccess: () => {
            toast.success('Cập nhật bài viết thành công')
            reset()
            onClose()
          },
        },
      )
    } else {
      createPost.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo bài viết thành công')
          reset()
          onClose()
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-2xl gap-0 p-0 rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12 sticky top-0 bg-white z-10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isEdit ? editingPost?.title : 'Nội dung sẽ lưu dưới dạng draft'}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          <FormField label="Tiêu đề" error={errors.title?.message}>
            <Input placeholder="Tiêu đề bài viết..." {...register('title')} aria-invalid={!!errors.title} />
          </FormField>

          <FormField label="Slug (tự động nếu để trống)">
            <Input placeholder="tieu-de-bai-viet" {...register('slug')} className="font-mono text-sm" />
          </FormField>

          <FormField label="Trạng thái">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Chọn trạng thái..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label="Nội dung" error={errors.content?.message}>
            <Textarea
              placeholder="Nội dung bài viết..."
              rows={8}
              {...register('content')}
              aria-invalid={!!errors.content}
              className="resize-y text-sm"
            />
          </FormField>

          <FormField label="Tóm tắt (excerpt)">
            <Textarea
              placeholder="Tóm tắt ngắn hiển thị trên danh sách..."
              rows={3}
              {...register('excerpt')}
              className="resize-none text-sm"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Danh mục">
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
            </FormField>

            <FormField label="Tags">
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
          </div>

          <FormField label="Cover File ID">
            <Input placeholder="ID của ảnh bìa (optional)" {...register('coverFileId')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Meta Title (SEO)">
              <Input placeholder="Tiêu đề SEO..." {...register('metaTitle')} />
            </FormField>
            <FormField label="Meta Description (SEO)">
              <Input placeholder="Mô tả SEO..." {...register('metaDesc')} />
            </FormField>
          </div>

          {isError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {isEdit ? 'Cập nhật thất bại.' : 'Tạo thất bại. Slug có thể đã tồn tại.'}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { reset(); onClose() }}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" isLoading={isPending}>
              {isPending
                ? isEdit ? 'Đang lưu...' : 'Đang tạo...'
                : isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
