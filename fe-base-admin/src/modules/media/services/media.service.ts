import { apiClient } from '@lib/api-client'
import { cleanPayload } from '@shared/utils'
import type {
  MediaFile,
  FolderNode,
  MediaListResponse,
  MediaListParams,
  UpdateFileMetaDto,
  CreateFolderDto,
} from '../types'

export const mediaService = {
  async listFiles(params?: MediaListParams): Promise<MediaListResponse> {
    const { pageSize, ...rest } = params ?? {}
    const { data } = await apiClient.get<MediaListResponse>('/admin/media/files', {
      params: cleanPayload({ ...rest, limit: pageSize ?? rest.limit }),
      withCredentials: true,
    })
    return data
  },

  async getFile(id: string): Promise<MediaFile> {
    const { data } = await apiClient.get<{ success: boolean; data: MediaFile }>(
      `/admin/media/files/${id}`,
      { withCredentials: true },
    )
    return data.data
  },

  async uploadFiles(
    files: File[],
    options: { scope?: string; folderId?: string; tags?: string[] } = {},
  ): Promise<MediaFile[]> {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    if (options.scope) form.append('scope', options.scope)
    if (options.folderId) form.append('folderId', options.folderId)
    if (options.tags?.length) form.append('tags', options.tags.join(','))

    const { data } = await apiClient.post<{ success: boolean; data: MediaFile[] }>(
      '/admin/media/files/upload',
      form,
      { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },

  async updateFileMeta(id: string, dto: UpdateFileMetaDto): Promise<void> {
    await apiClient.patch(`/admin/media/files/${id}`, dto, { withCredentials: true })
  },

  async deleteFile(id: string): Promise<void> {
    await apiClient.delete(`/admin/media/files/${id}`, { withCredentials: true })
  },

  async getSignedUrl(id: string): Promise<{ signedUrl: string; expiresAt: string }> {
    const { data } = await apiClient.get<{ success: boolean; data: { signedUrl: string; expiresAt: string } }>(
      `/admin/media/files/${id}/signed-url`,
      { withCredentials: true },
    )
    return data.data
  },

  async listFolders(): Promise<FolderNode[]> {
    const { data } = await apiClient.get<{ success: boolean; data: FolderNode[] }>(
      '/admin/media/folders',
      { withCredentials: true },
    )
    return data.data
  },

  async createFolder(dto: CreateFolderDto): Promise<{ folderId: string }> {
    const { data } = await apiClient.post('/admin/media/folders', dto, { withCredentials: true })
    return data
  },

  async renameFolder(id: string, name: string): Promise<void> {
    await apiClient.patch(`/admin/media/folders/${id}/rename`, { name }, { withCredentials: true })
  },

  async moveFolder(id: string, parentId: string | null): Promise<void> {
    await apiClient.patch(`/admin/media/folders/${id}/move`, { parentId }, { withCredentials: true })
  },

  async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/admin/media/folders/${id}`, { withCredentials: true })
  },
}
