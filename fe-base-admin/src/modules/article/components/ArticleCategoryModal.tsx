import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FolderOpen, AlertTriangle, Image, X } from 'lucide-react'
import { toast } from 'sonner'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '') || str.toLowerCase().replace(/\s+/g, '-')
}
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { MediaPicker } from '@modules/media'
import { useCreateCategory, useUpdateCategory } from '../hooks/useArticleTaxonomy'
import type { ArticleCategory } from '../types'

const formSchema = z.object({
  name: z.string().min(1, 'Bắt buộc').max(200, 'Tối đa 200 ký tự'),
  slug: z.string().optional(),
  colorCode: z.string().optional(),
  iconUrl: z.string().optional(),
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

interface ArticleCategoryModalProps {
  open: boolean
  onClose: () => void
  editingCategory?: ArticleCategory | null
}

export function ArticleCategoryModal({ open, onClose, editingCategory }: ArticleCategoryModalProps) {
  const isEdit = !!editingCategory
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending
  const isError = createCategory.isError || updateCategory.isError

  const [showMediaPicker, setShowMediaPicker] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  const iconUrl = watch('iconUrl')

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        reset({
          name: editingCategory.name,
          slug: editingCategory.slug,
          colorCode: editingCategory.colorCode ?? '',
          iconUrl: editingCategory.iconUrl ?? '',
        })
      } else {
        reset({ name: '', slug: '', colorCode: '', iconUrl: '' })
      }
    }
  }, [open, editingCategory, reset])

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug || toSlug(values.name),
      colorCode: values.colorCode || undefined,
      iconUrl: values.iconUrl || undefined,
    }

    if (isEdit && editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, dto: payload },
        {
          onSuccess: () => {
            toast.success('Cập nhật chủ đề thành công')
            reset()
            onClose()
          },
          onError: () => toast.error('Cập nhật thất bại'),
        },
      )
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo chủ đề thành công')
          reset()
          onClose()
        },
        onError: () => toast.error('Tạo thất bại. Tên hoặc slug có thể đã tồn tại.'),
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
        <DialogContent className="max-w-md gap-0 p-0 rounded-2xl">
          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
              <FolderOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                {isEdit ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {isEdit ? editingCategory?.name : 'Phân loại bài đọc'}
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
            <FormField label="Tên chủ đề" error={errors.name?.message}>
              <Input placeholder="Ngữ pháp N3" {...register('name')} aria-invalid={!!errors.name} />
            </FormField>

            <FormField label="Slug (tự động nếu để trống)">
              <Input placeholder="ngu-phap-n3" {...register('slug')} className="font-mono text-sm" />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              {/* Color code picker */}
              <div className="space-y-1.5">
                <FieldLabel className="text-sm font-medium text-gray-700">Màu sắc</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    {...register('colorCode')}
                    defaultValue="#6366f1"
                    className="h-8 w-10 cursor-pointer rounded border border-gray-200 p-0.5"
                  />
                  <Input
                    {...register('colorCode')}
                    placeholder="#6366f1"
                    className="flex-1 h-8 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Icon preview */}
              <div className="space-y-1.5">
                <FieldLabel className="text-sm font-medium text-gray-700">Icon</FieldLabel>
                <div className="flex items-center gap-2">
                  {iconUrl ? (
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-gray-200">
                      <img src={iconUrl} alt="icon" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setValue('iconUrl', '')}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 gap-1 text-xs"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <Image className="h-3 w-3" />
                    {iconUrl ? 'Đổi icon' : 'Chọn icon'}
                  </Button>
                </div>
              </div>
            </div>

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
                  : isEdit ? 'Lưu thay đổi' : 'Tạo chủ đề'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(file) => {
          setValue('iconUrl', file.url)
          setShowMediaPicker(false)
        }}
      />
    </>
  )
}
