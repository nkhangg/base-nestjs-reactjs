import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type { CreateQuestionDto, Question, QuestionListResponse, UpdateQuestionDto } from '../types'

export const questionService = {
  async list(params?: NestjsPaginateParams): Promise<QuestionListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & QuestionListResponse>(
      '/admin/questions',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getById(id: string): Promise<Question> {
    const { data } = await apiClient.get<{ success: boolean; data: Question }>(
      `/admin/questions/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async create(dto: CreateQuestionDto): Promise<{ success: boolean; questionId: string }> {
    const { data } = await apiClient.post('/admin/questions', dto, { withCredentials: true })
    return data
  },

  async update(id: string, dto: UpdateQuestionDto): Promise<void> {
    await apiClient.patch(`/admin/questions/${id}`, dto, { withCredentials: true })
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/questions/${id}`, { withCredentials: true })
  },

  async approve(id: string): Promise<void> {
    await apiClient.post(`/admin/questions/${id}/approve`, {}, { withCredentials: true })
  },

  async reject(id: string): Promise<void> {
    await apiClient.post(`/admin/questions/${id}/reject`, {}, { withCredentials: true })
  },
}
