import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FolderOpen, AlertTriangle } from 'lucide-react'
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
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { useCreateCategory, useUpdateCategory } from '../hooks/useBlogCategories'
import type { BlogCategory } from '../types'

const formSchema = z.object({
  name: z.string().min(1, 'Bắt buộc').max(200, 'Tối đa 200 ký tự'),
  slug: z.string().optional(),
  description: z.string().optional(),
  coverFileId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel className="text-sm font-medium text-gray-700">{label}</FieldLabel>
      {children}
      {error && <FieldError className="text-xs">{error}</FieldError>}
    </div>
  )
}

interface BlogCategoryModalProps {
  open: boolean
  onClose: () => void
  editingCategory?: BlogCategory | null
}

export function BlogCategoryModal({ open, onClose, editingCategory }: BlogCategoryModalProps) {
  const isEdit = !!editingCategory
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending
  const isError = createCategory.isError || updateCategory.isError

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        reset({
          name: editingCategory.name,
          slug: editingCategory.slug,
          description: editingCategory.description ?? '',
          coverFileId: editingCategory.coverFileId ?? '',
        })
      } else {
        reset({ name: '', slug: '', description: '', coverFileId: '' })
      }
    }
  }, [open, editingCategory, reset])

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      coverFileId: values.coverFileId || undefined,
    }

    if (isEdit && editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, dto: payload },
        {
          onSuccess: () => {
            toast.success('Cập nhật danh mục thành công')
            reset()
            onClose()
          },
        },
      )
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo danh mục thành công')
          reset()
          onClose()
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-md gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <FolderOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              {isEdit ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isEdit ? editingCategory?.name : 'Phân loại bài viết blog'}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          <FormField label="Tên danh mục" error={errors.name?.message}>
            <Input placeholder="Công nghệ" {...register('name')} aria-invalid={!!errors.name} />
          </FormField>

          <FormField label="Slug (tự động nếu để trống)">
            <Input placeholder="cong-nghe" {...register('slug')} className="font-mono text-sm" />
          </FormField>

          <FormField label="Mô tả">
            <Textarea
              placeholder="Mô tả ngắn về danh mục..."
              rows={3}
              {...register('description')}
              className="resize-none text-sm"
            />
          </FormField>

          <FormField label="Cover File ID">
            <Input placeholder="ID của ảnh bìa (optional)" {...register('coverFileId')} />
          </FormField>

          {isError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {isEdit ? 'Cập nhật thất bại.' : 'Tạo thất bại. Tên hoặc slug có thể đã tồn tại.'}
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
                : isEdit ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
