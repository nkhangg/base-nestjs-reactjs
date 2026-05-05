export type MediaScope = 'public' | 'private'

export interface MediaFile {
  id: string
  key: string
  filename: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  url: string
  thumbnailUrl: string | null
  alt: string | null
  scope: MediaScope
  folderId: string | null
  tags: string[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  children: FolderNode[]
  createdAt: string
}

export interface UpdateFileMetaDto {
  filename?: string
  alt?: string | null
  tags?: string[]
  scope?: MediaScope
  folderId?: string | null
}

export interface CreateFolderDto {
  name: string
  parentId?: string
}

export interface MediaListParams {
  page?: number
  limit?: number
  pageSize?: number
  search?: string
  scope?: MediaScope
  mimeType?: string
  folderId?: string | null
}

export interface MediaListMeta {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

export interface MediaListResponse {
  data: MediaFile[]
  meta: MediaListMeta
}
