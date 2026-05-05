import type { AdminListMeta } from '@modules/admin/types'

export type BlogPostStatus = 'draft' | 'published' | 'archived'
export type BlogPostContentType = 'markdown' | 'html' | 'plain'

export interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  contentType: BlogPostContentType
  excerpt: string | null
  status: BlogPostStatus
  coverFileId: string | null
  categoryId: string | null
  tags: string[]
  authorId: string | null
  metaTitle: string | null
  metaDesc: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  coverFileId: string | null
  createdAt: string
  updatedAt: string
}

export interface BlogListResponse {
  data: BlogPost[]
  meta: AdminListMeta
}

export interface CategoryListResponse {
  data: BlogCategory[]
  meta: AdminListMeta
}

export interface CreatePostDto {
  title: string
  slug?: string
  content: string
  contentType?: BlogPostContentType
  excerpt?: string
  status?: BlogPostStatus
  coverFileId?: string
  categoryId?: string
  tags?: string[]
  metaTitle?: string
  metaDesc?: string
}

export interface UpdatePostDto {
  slug?: string
  title?: string
  content?: string
  contentType?: BlogPostContentType
  excerpt?: string | null
  status?: BlogPostStatus
  coverFileId?: string | null
  categoryId?: string | null
  tags?: string[]
  metaTitle?: string | null
  metaDesc?: string | null
}

export interface CreateCategoryDto {
  name: string
  slug?: string
  description?: string
  coverFileId?: string
}

export interface UpdateCategoryDto {
  name?: string
  slug?: string
  description?: string | null
  coverFileId?: string | null
}
