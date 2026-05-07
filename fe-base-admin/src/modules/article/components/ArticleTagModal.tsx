import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tag, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { useCreateTag } from '../hooks/useArticleTaxonomy'

const formSchema = z.object({
  name: z.string().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
})

type FormValues = z.infer<typeof formSchema>

interface ArticleTagModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (tagId: string, tagName: string) => void
}

export function ArticleTagModal({ open, onClose, onCreated }: ArticleTagModalProps) {
  const createTag = useCreateTag()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) })

  useEffect(() => {
    if (open) reset({ name: '' })
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    createTag.mutate(
      { name: values.name },
      {
        onSuccess: (res) => {
          toast.success('Đã tạo tag')
          onCreated?.(res.tagId, values.name)
          reset()
          onClose()
        },
        onError: () => toast.error('Tạo tag thất bại'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
            <Tag className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">Tạo tag mới</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Tag phân loại bài đọc</DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <FieldLabel className="text-sm font-medium text-gray-700">Tên tag</FieldLabel>
            <Input
              placeholder="grammar, vocabulary, n3..."
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <FieldError className="text-xs">{errors.name.message}</FieldError>}
          </div>

          {createTag.isError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Tạo thất bại. Tên tag có thể đã tồn tại.
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { reset(); onClose() }}
              disabled={createTag.isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" isLoading={createTag.isPending}>
              {createTag.isPending ? 'Đang tạo...' : 'Tạo tag'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
