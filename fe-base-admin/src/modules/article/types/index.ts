import type { AdminListMeta } from '@modules/admin/types'

export type ArticleStatus = 'pending' | 'approved' | 'rejected' | 'published'

export interface Article {
  id: string
  title: string
  slug: string
  level: number | null
  status: ArticleStatus
  authorId: string | null
  staffAuthorId: string | null
  verifiedBy: string | null
  categoryIds: string[]
  tagIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ArticleDetail extends Article {
  contentRaw: string
  contentAnnotated: Record<string, unknown> | null
}

export interface ArticleCategory {
  id: string
  name: string
  slug: string
  colorCode: string | null
  iconUrl: string | null
}

export interface ArticleTag {
  id: string
  name: string
}

export interface ArticleListResponse {
  data: Article[]
  meta: AdminListMeta
}

export interface ArticleCategoryListResponse {
  data: ArticleCategory[]
}

export interface ArticleTagListResponse {
  data: ArticleTag[]
}

export interface CreateArticleDto {
  title: string
  slug: string
  contentRaw: string
  level?: number
  categoryIds?: string[]
  tagIds?: string[]
}

export interface UpdateArticleDto {
  title?: string
  slug?: string
  contentRaw?: string
  level?: number | null
  categoryIds?: string[]
  tagIds?: string[]
}

export interface CreateCategoryDto {
  name: string
  slug: string
  colorCode?: string
  iconUrl?: string
}

export interface UpdateCategoryDto {
  name?: string
  slug?: string
  colorCode?: string | null
  iconUrl?: string | null
}

export interface CreateTagDto {
  name: string
}
