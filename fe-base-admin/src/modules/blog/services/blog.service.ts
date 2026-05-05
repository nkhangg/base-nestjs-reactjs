import { apiClient } from '@lib/api-client'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type {
  BlogListResponse,
  BlogPost,
  CategoryListResponse,
  CreateCategoryDto,
  CreatePostDto,
  UpdateCategoryDto,
  UpdatePostDto,
} from '../types'

export const blogService = {
  // ── Posts ──────────────────────────────────────────────────────────────────

  async listPosts(params?: NestjsPaginateParams): Promise<BlogListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & BlogListResponse>(
      '/admin/blog/posts',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async getPost(id: string): Promise<BlogPost> {
    const { data } = await apiClient.get<{ success: boolean; data: BlogPost }>(
      `/admin/blog/posts/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async createPost(dto: CreatePostDto): Promise<{ success: boolean; postId: string }> {
    const { data } = await apiClient.post('/admin/blog/posts', dto, { withCredentials: true })
    return data
  },

  async updatePost(id: string, dto: UpdatePostDto): Promise<void> {
    await apiClient.patch(`/admin/blog/posts/${id}`, dto, { withCredentials: true })
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/admin/blog/posts/${id}`, { withCredentials: true })
  },

  async publishPost(id: string): Promise<void> {
    await apiClient.post(`/admin/blog/posts/${id}/publish`, {}, { withCredentials: true })
  },

  async unpublishPost(id: string): Promise<void> {
    await apiClient.post(`/admin/blog/posts/${id}/unpublish`, {}, { withCredentials: true })
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  async listCategories(params?: NestjsPaginateParams): Promise<CategoryListResponse> {
    const { data } = await apiClient.get<{ success: boolean } & CategoryListResponse>(
      '/admin/blog/categories',
      { params, withCredentials: true },
    )
    return { data: data.data, meta: data.meta }
  },

  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<{ success: boolean; categoryId: string }> {
    const { data } = await apiClient.post('/admin/blog/categories', dto, {
      withCredentials: true,
    })
    return data
  },

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<void> {
    await apiClient.patch(`/admin/blog/categories/${id}`, dto, { withCredentials: true })
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/blog/categories/${id}`, { withCredentials: true })
  },
}
