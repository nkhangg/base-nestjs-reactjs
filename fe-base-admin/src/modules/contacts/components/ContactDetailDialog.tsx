import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { User, AlertTriangle, Trash2, Send, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Textarea } from '@shared/components/ui/textarea'
import { FieldLabel, FieldError } from '@shared/components/ui/field'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { cn } from '@shared/utils'
import { useContact, useUpdateContactStatus, useDeleteContact, useReplyToContact } from '../hooks/useContacts'
import type { ContactStatus } from '../types'

const STATUS_COLORS: Record<ContactStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  READ: 'bg-blue-100 text-blue-700',
  RESPONDED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
}

const STATUS_DOTS: Record<ContactStatus, string> = {
  PENDING: 'bg-yellow-500',
  READ: 'bg-blue-500',
  RESPONDED: 'bg-green-500',
  CLOSED: 'bg-gray-400',
}

const STATUS_OPTION_KEYS: ContactStatus[] = ['PENDING', 'READ', 'RESPONDED', 'CLOSED']

const formSchema = z.object({
  status: z.enum(['PENDING', 'READ', 'RESPONDED', 'CLOSED']),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const replySchema = z.object({
  message: z.string().min(10, 'Tối thiểu 10 ký tự'),
})

type ReplyFormValues = z.infer<typeof replySchema>

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

const TAB_TRIGGER_CLASS =
  'relative rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 text-sm font-medium text-gray-500 shadow-none transition-colors data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none'

interface ContactDetailDialogProps {
  contactId: string | null
  onClose: () => void
}

export function ContactDetailDialog({ contactId, onClose }: ContactDetailDialogProps) {
  const { t } = useTranslation()
  const open = !!contactId
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const autoReadFiredRef = useRef<string | null>(null)

  const { data: contact, isLoading, isError } = useContact(contactId ?? undefined)
  const updateStatus = useUpdateContactStatus()
  const deleteContact = useDeleteContact()
  const replyToContact = useReplyToContact()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  const {
    register: registerReply,
    handleSubmit: handleReplySubmit,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
  })

  const currentStatus = watch('status')

  useEffect(() => {
    if (contact) {
      reset({ status: contact.status, note: contact.note ?? '' })
    }
  }, [contact, reset])

  // Auto-mark READ when a PENDING contact is opened; guard against React 18 double-effect
  useEffect(() => {
    if (
      contact &&
      contact.status === 'PENDING' &&
      contactId &&
      autoReadFiredRef.current !== contactId
    ) {
      autoReadFiredRef.current = contactId
      updateStatus.mutate(
        { id: contactId, dto: { status: 'READ' } },
        {
          onSuccess: () => setValue('status', 'READ', { shouldDirty: false }),
        },
      )
    }
  }, [contact, contactId, updateStatus, setValue])

  useEffect(() => {
    if (!open) {
      autoReadFiredRef.current = null
      reset()
      resetReply()
    }
  }, [open, reset, resetReply])

  const onSubmit = (values: FormValues) => {
    if (!contactId) return
    updateStatus.mutate(
      { id: contactId, dto: { status: values.status, note: values.note || undefined } },
      { onSuccess: () => reset(values, { keepDirty: false }) },
    )
  }

  const handleDelete = () => {
    if (!contactId) return
    deleteContact.mutate(contactId, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        onClose()
      },
    })
  }

  const onReply = (values: ReplyFormValues) => {
    if (!contactId) return
    replyToContact.mutate(
      { id: contactId, dto: { replyMessage: values.message } },
      { onSuccess: () => resetReply() },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="max-w-2xl gap-0 p-0 rounded-2xl">
          {/* Header — always rendered for accessibility */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 pr-14">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold select-none',
                contact ? 'bg-gray-900' : 'bg-gray-100',
              )}>
                {contact
                  ? getInitials(contact.fullName)
                  : <User className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold text-gray-900 truncate">
                  {contact?.fullName ?? t('contacts.detail', { defaultValue: 'Chi tiết liên hệ' })}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 truncate">
                  {contact
                    ? `${contact.email}${contact.phone ? ` · ${contact.phone}` : ''}`
                    : isLoading
                      ? t('common.loading', { defaultValue: 'Đang tải...' })
                      : ' '
                  }
                </DialogDescription>
              </div>
            </div>
            {contact && (
              <Badge className={cn('shrink-0 ml-3 text-[11px] font-medium border-0', STATUS_COLORS[contact.status])}>
                {t(`contacts.statusOptions.${contact.status}`, { defaultValue: contact.status })}
              </Badge>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              {t('common.loading', { defaultValue: 'Đang tải...' })}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-2 m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t('common.error', { defaultValue: 'Có lỗi xảy ra' })}
            </div>
          )}

          {/* Tab content */}
          {contact && (
            <Tabs defaultValue="info">
              {/* Tab nav */}
              <div className="border-b border-gray-100 px-6">
                <TabsList className="h-auto gap-6 rounded-none bg-transparent p-0">
                  <TabsTrigger value="info" className={TAB_TRIGGER_CLASS}>
                    {t('contacts.tabInfo', { defaultValue: 'Thông tin' })}
                  </TabsTrigger>
                  <TabsTrigger value="manage" className={TAB_TRIGGER_CLASS}>
                    {t('contacts.tabManage', { defaultValue: 'Quản lý' })}
                  </TabsTrigger>
                  <TabsTrigger value="reply" className={cn(TAB_TRIGGER_CLASS, 'pr-3')}>
                    {t('contacts.tabReply', { defaultValue: 'Phản hồi' })}
                    {contact.respondedAt && (
                      <span className="absolute top-2 -right-0 h-1.5 w-1.5 rounded-full bg-green-500" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Info tab ── */}
              <TabsContent value="info" className="mt-0 max-h-[55vh] overflow-y-auto px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('contacts.subject', { defaultValue: 'Chủ đề' })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{contact.subject}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('contacts.message', { defaultValue: 'Nội dung' })}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed rounded-lg bg-gray-50 px-4 py-3">
                    {contact.message}
                  </p>
                </div>

                {/* Timestamps */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[140px] rounded-lg bg-gray-50 px-3 py-2.5">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                      {t('contacts.createdAt', { defaultValue: 'Gửi lúc' })}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(contact.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {contact.respondedAt && (
                    <div className="flex-1 min-w-[140px] rounded-lg bg-green-50 px-3 py-2.5">
                      <p className="text-[10px] font-medium text-green-500 uppercase tracking-wide mb-0.5">
                        {t('contacts.respondedAt', { defaultValue: 'Phản hồi lúc' })}
                      </p>
                      <p className="text-xs font-medium text-green-700">
                        {new Date(contact.respondedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Manage tab ── */}
              <TabsContent value="manage" className="mt-0 px-6 py-5">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <FieldLabel className="text-sm font-medium text-gray-700">
                      {t('contacts.updateStatus', { defaultValue: 'Cập nhật trạng thái' })}
                    </FieldLabel>
                    <Select
                      value={currentStatus}
                      onValueChange={(v) =>
                        setValue('status', v as ContactStatus, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTION_KEYS.map((value) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_DOTS[value])} />
                              {t(`contacts.statusOptions.${value}`, { defaultValue: value })}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && <FieldError>{errors.status.message}</FieldError>}
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel className="text-sm font-medium text-gray-700">
                      {t('contacts.note', { defaultValue: 'Ghi chú' })}
                    </FieldLabel>
                    <Textarea
                      placeholder={t('contacts.notePlaceholder', {
                        defaultValue: 'Ghi chú nội bộ (không hiển thị với người dùng)',
                      })}
                      rows={4}
                      {...register('note')}
                      className="resize-none text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('contacts.delete', { defaultValue: 'Xóa' })}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="ml-auto"
                      disabled={!isDirty}
                      isLoading={updateStatus.isPending}
                    >
                      {t('contacts.saveStatus', { defaultValue: 'Lưu thay đổi' })}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ── Reply tab ── */}
              <TabsContent value="reply" className="mt-0 px-6 py-5">
                {contact.respondedAt ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      {t('contacts.alreadyReplied', { defaultValue: 'Đã gửi phản hồi lúc' })}:{' '}
                      {new Date(contact.respondedAt).toLocaleString('vi-VN')}
                    </div>
                    {contact.replyMessage && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {t('contacts.replyContent', { defaultValue: 'Nội dung đã phản hồi' })}
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed rounded-lg bg-gray-50 px-4 py-3">
                          {contact.replyMessage}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit(onReply)} className="space-y-3">
                    <div className="space-y-1.5">
                      <Textarea
                        placeholder={t('contacts.replyPlaceholder', {
                          defaultValue: 'Nhập nội dung email phản hồi sẽ gửi tới {{email}}...',
                          email: contact.email,
                        })}
                        rows={5}
                        {...registerReply('message')}
                        className="resize-none text-sm"
                      />
                      {replyErrors.message && (
                        <FieldError>{replyErrors.message.message}</FieldError>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-2"
                        isLoading={replyToContact.isPending}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {t('contacts.sendReply', { defaultValue: 'Gửi phản hồi' })}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        variant="danger"
        title={t('contacts.deleteTitle', { defaultValue: 'Xóa liên hệ?' })}
        description={t('contacts.deleteConfirm', {
          defaultValue: 'Hành động này không thể hoàn tác.',
        })}
        confirmLabel={t('contacts.delete', { defaultValue: 'Xóa' })}
        loading={deleteContact.isPending}
      />
    </>
  )
}
