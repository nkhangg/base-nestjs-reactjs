import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type { Contact, ContactListResponse, ReplyToContactDto, UpdateContactStatusDto } from '../types'

export const contactsService = {
  async listContacts(params?: NestjsPaginateParams): Promise<ContactListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & ContactListResponse>(
      '/admin/contacts',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getContact(id: string): Promise<Contact> {
    const { data } = await apiClient.get<{ success: boolean; data: Contact }>(
      `/admin/contacts/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async updateContactStatus(id: string, dto: UpdateContactStatusDto): Promise<Contact> {
    const { data } = await apiClient.patch<{ success: boolean; data: Contact }>(
      `/admin/contacts/${id}`,
      dto,
      { withCredentials: true },
    )
    return data.data
  },

  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/admin/contacts/${id}`, { withCredentials: true })
  },

  async replyToContact(id: string, dto: ReplyToContactDto): Promise<Contact> {
    const { data } = await apiClient.post<{ success: boolean; data: Contact }>(
      `/admin/contacts/${id}/reply`,
      dto,
      { withCredentials: true },
    )
    return data.data
  },
}
