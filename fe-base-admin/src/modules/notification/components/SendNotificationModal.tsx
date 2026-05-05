import { useEffect } from 'react'
import { Controller, useForm, type FieldError } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Textarea } from '@shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { useSendNotification } from '../hooks/useSendNotification'
import { RecipientPicker } from './RecipientPicker'
import type { NotificationTarget, NotificationType } from '../types'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    body: z.string().min(1, 'Nội dung không được để trống'),
    type: z.enum(['system', 'info', 'warning', 'alert', 'success']),
    targetMode: z.enum([
      'all-admins',
      'all-users',
      'broadcast',
      'specific-admins',
      'specific-users',
    ]),
    recipientIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    const needsPicker =
      data.targetMode === 'specific-admins' || data.targetMode === 'specific-users'
    if (needsPicker && data.recipientIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng chọn ít nhất 1 đối tượng',
        path: ['recipientIds'],
      })
    }
  })

type FormValues = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTargets(values: FormValues): NotificationTarget[] {
  if (values.targetMode === 'specific-admins') {
    return values.recipientIds.map((id) => ({
      kind: 'individual' as const,
      recipientId: id,
      recipientType: 'admin' as const,
    }))
  }
  if (values.targetMode === 'specific-users') {
    return values.recipientIds.map((id) => ({
      kind: 'individual' as const,
      recipientId: id,
      recipientType: 'user' as const,
    }))
  }
  return [{ kind: values.targetMode } as NotificationTarget]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
}

export function SendNotificationModal({ open, onClose }: Props) {
  const { mutate: send, isPending } = useSendNotification()

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'info', targetMode: 'all-admins', recipientIds: [] },
  })

  const targetMode = watch('targetMode')
  const recipientIds = watch('recipientIds')

  // Clear selections when switching target mode
  useEffect(() => {
    setValue('recipientIds', [])
  }, [targetMode, setValue])

  const onSubmit = (values: FormValues) => {
    send(
      {
        title: values.title,
        body: values.body,
        type: values.type as NotificationType,
        targets: buildTargets(values),
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  const showPicker =
    targetMode === 'specific-admins' || targetMode === 'specific-users'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gửi thông báo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input id="title" {...register('title')} placeholder="Tiêu đề thông báo" />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="body">Nội dung</Label>
            <Textarea
              id="body"
              {...register('body')}
              placeholder="Nội dung thông báo"
              rows={3}
            />
            {errors.body && (
              <p className="text-xs text-destructive">{errors.body.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Loại thông báo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Target */}
          <div className="space-y-1.5">
            <Label>Gửi đến</Label>
            <Controller
              name="targetMode"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đối tượng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-admins">Tất cả admin</SelectItem>
                    <SelectItem value="all-users">Tất cả user</SelectItem>
                    <SelectItem value="broadcast">Tất cả (broadcast)</SelectItem>
                    <SelectItem value="specific-admins">Admin cụ thể…</SelectItem>
                    <SelectItem value="specific-users">User cụ thể…</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Recipient picker — hiện khi chọn specific */}
          {showPicker && (
            <RecipientPicker
              type={targetMode === 'specific-admins' ? 'admin' : 'user'}
              value={recipientIds}
              onChange={(ids) => setValue('recipientIds', ids, { shouldValidate: true })}
              error={(errors.recipientIds as FieldError | undefined)?.message}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang gửi…' : 'Gửi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
