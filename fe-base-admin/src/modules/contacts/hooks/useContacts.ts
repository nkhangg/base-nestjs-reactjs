import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { QUERY_KEYS } from '@shared/constants'
import { contactsService } from '../services/contacts.service'
import type { ReplyToContactDto, UpdateContactStatusDto } from '../types'

export function useContactList(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTACTS.LIST, JSON.stringify(params)],
    queryFn: () => contactsService.listContacts(params),
    placeholderData: keepPreviousData,
  })
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTACTS.DETAIL, id],
    queryFn: () => contactsService.getContact(id!),
    enabled: !!id,
  })
}

export function useUpdateContactStatus() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateContactStatusDto }) =>
      contactsService.updateContactStatus(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS.LIST })
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.CONTACTS.DETAIL, id] })
      toast.success(t('contacts.updateStatus') + ' ' + t('common.success', { defaultValue: 'thành công' }))
    },
    onError: () => toast.error(t('common.error', { defaultValue: 'Có lỗi xảy ra' })),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => contactsService.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS.LIST })
      toast.success(t('contacts.delete') + ' ' + t('common.success', { defaultValue: 'thành công' }))
    },
    onError: () => toast.error(t('common.error', { defaultValue: 'Có lỗi xảy ra' })),
  })
}

function extractApiError(error: unknown, fallback: string): string {
  const data = (error as AxiosError<{ message: string | string[] }>).response?.data
  if (Array.isArray(data?.message) && data.message.length > 0) return data.message[0]
  if (typeof data?.message === 'string') return data.message
  return fallback
}

export function useReplyToContact() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReplyToContactDto }) =>
      contactsService.replyToContact(id, dto),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS.LIST })
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.CONTACTS.DETAIL, id] })
      toast.success(t('contacts.replySent', { defaultValue: 'Đã gửi phản hồi thành công' }))
    },
    onError: (error) =>
      toast.error(extractApiError(error, t('common.error', { defaultValue: 'Có lỗi xảy ra' }))),
  })
}
