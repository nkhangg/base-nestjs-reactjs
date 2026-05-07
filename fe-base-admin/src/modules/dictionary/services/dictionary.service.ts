import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type {
  CreateDictionaryEntryDto,
  DictionaryEntry,
  DictionaryListResponse,
  RejectDictionaryDto,
  UpdateDictionaryEntryDto,
} from '../types'

export const dictionaryService = {
  async list(params?: NestjsPaginateParams): Promise<DictionaryListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & DictionaryListResponse>(
      '/admin/dictionary',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getPending(): Promise<DictionaryEntry[]> {
    const { data } = await apiClient.get<{ success: boolean; data: DictionaryEntry[] }>(
      '/admin/dictionary/pending',
      { withCredentials: true },
    )
    return data.data
  },

  async getById(id: string): Promise<DictionaryEntry> {
    const { data } = await apiClient.get<{ success: boolean; data: DictionaryEntry }>(
      `/admin/dictionary/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async create(dto: CreateDictionaryEntryDto): Promise<{ success: boolean; entryId: string }> {
    const { data } = await apiClient.post('/admin/dictionary', dto, { withCredentials: true })
    return data
  },

  async update(id: string, dto: UpdateDictionaryEntryDto): Promise<void> {
    await apiClient.patch(`/admin/dictionary/${id}`, dto, { withCredentials: true })
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/dictionary/${id}`, { withCredentials: true })
  },

  async approve(id: string): Promise<void> {
    await apiClient.post(`/admin/dictionary/${id}/approve`, {}, { withCredentials: true })
  },

  async reject(id: string, dto?: RejectDictionaryDto): Promise<void> {
    await apiClient.post(`/admin/dictionary/${id}/reject`, dto ?? {}, { withCredentials: true })
  },
}
