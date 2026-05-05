import { apiClient } from '@lib/api-client'
import { mediaService } from '@modules/media'
import type { FolderNode } from '@modules/media'
import type { ProfileData, UpdateProfileDto, SessionItem } from '../types'

export const profileService = {
  async getProfile(): Promise<ProfileData> {
    const { data } = await apiClient.get<ProfileData>('/auth/profile', {
      withCredentials: true,
    })
    return data
  },

  async updateProfile(dto: UpdateProfileDto): Promise<ProfileData> {
    const { data } = await apiClient.patch<ProfileData>('/auth/profile', dto, {
      withCredentials: true,
    })
    return data
  },

  async getSessions(): Promise<SessionItem[]> {
    const { data } = await apiClient.get<SessionItem[]>('/auth/sessions', {
      withCredentials: true,
    })
    return data
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`, {
      withCredentials: true,
    })
  },

  async getOrCreateAvatarFolderId(): Promise<string> {
    const folders = await mediaService.listFolders()

    const findFolder = (nodes: FolderNode[], name: string): FolderNode | undefined =>
      nodes.find((n) => n.name.toLowerCase() === name.toLowerCase())

    let adminFolder = findFolder(folders, 'admin')
    if (!adminFolder) {
      const { folderId } = await mediaService.createFolder({ name: 'admin' })
      const refreshed = await mediaService.listFolders()
      adminFolder = refreshed.find((n) => n.id === folderId)!
    }

    let avatarFolder = findFolder(adminFolder.children ?? [], 'avatar')
    if (!avatarFolder) {
      const { folderId } = await mediaService.createFolder({ name: 'avatar', parentId: adminFolder.id })
      return folderId
    }

    return avatarFolder.id
  },
}
