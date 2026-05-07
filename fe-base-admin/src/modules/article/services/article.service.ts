import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type {
  ArticleListResponse,
  ArticleDetail,
  ArticleCategoryListResponse,
  ArticleTagListResponse,
  CreateArticleDto,
  UpdateArticleDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateTagDto,
} from '../types'

export const articleService = {
  // ── Articles ───────────────────────────────────────────────────────────────

  async list(params?: NestjsPaginateParams): Promise<ArticleListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & ArticleListResponse>(
      '/admin/articles',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async listPending(params?: NestjsPaginateParams): Promise<ArticleListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & ArticleListResponse>(
      '/admin/articles/pending',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getById(id: string): Promise<ArticleDetail> {
    const { data } = await apiClient.get<{ success: boolean; data: ArticleDetail }>(
      `/admin/articles/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async create(dto: CreateArticleDto): Promise<{ success: boolean; articleId: string }> {
    const { data } = await apiClient.post('/admin/articles', dto, { withCredentials: true })
    return data
  },

  async update(id: string, dto: UpdateArticleDto): Promise<void> {
    await apiClient.patch(`/admin/articles/${id}`, dto, { withCredentials: true })
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/articles/${id}`, { withCredentials: true })
  },

  async publish(id: string): Promise<void> {
    await apiClient.post(`/admin/articles/${id}/publish`, {}, { withCredentials: true })
  },

  async unpublish(id: string): Promise<void> {
    await apiClient.post(`/admin/articles/${id}/unpublish`, {}, { withCredentials: true })
  },

  async approve(id: string): Promise<void> {
    await apiClient.post(`/admin/articles/${id}/approve`, {}, { withCredentials: true })
  },

  async reject(id: string): Promise<void> {
    await apiClient.post(`/admin/articles/${id}/reject`, {}, { withCredentials: true })
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  async listCategories(): Promise<ArticleCategoryListResponse> {
    const { data } = await apiClient.get<ArticleCategoryListResponse>(
      '/admin/articles/categories',
      { withCredentials: true },
    )
    return data
  },

  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<{ success: boolean; categoryId: string }> {
    const { data } = await apiClient.post('/admin/articles/categories', dto, {
      withCredentials: true,
    })
    return data
  },

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<void> {
    await apiClient.patch(`/admin/articles/categories/${id}`, dto, { withCredentials: true })
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/articles/categories/${id}`, { withCredentials: true })
  },

  // ── Tags ───────────────────────────────────────────────────────────────────

  async listTags(): Promise<ArticleTagListResponse> {
    const { data } = await apiClient.get<ArticleTagListResponse>(
      '/admin/articles/tags',
      { withCredentials: true },
    )
    return data
  },

  async createTag(dto: CreateTagDto): Promise<{ success: boolean; tagId: string }> {
    const { data } = await apiClient.post('/admin/articles/tags', dto, { withCredentials: true })
    return data
  },

  async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/admin/articles/tags/${id}`, { withCredentials: true })
  },
}
