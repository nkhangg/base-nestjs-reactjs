import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MediaListParams, UpdateFileMetaDto, CreateFolderDto } from '../types'
import { mediaService } from '../services/media.service'

export const MEDIA_FILES_KEY = ['media', 'files']
export const MEDIA_FOLDERS_KEY = ['media', 'folders']

export function useMediaFiles(params: MediaListParams) {
  return useQuery({
    queryKey: [...MEDIA_FILES_KEY, JSON.stringify(params)],
    queryFn: () => mediaService.listFiles(params),
    placeholderData: keepPreviousData,
  })
}

export function useMediaFile(id: string | null) {
  return useQuery({
    queryKey: [...MEDIA_FILES_KEY, id],
    queryFn: () => mediaService.getFile(id!),
    enabled: !!id,
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      files,
      options,
    }: {
      files: File[]
      options?: { scope?: string; folderId?: string; tags?: string[] }
    }) => mediaService.uploadFiles(files, options),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FILES_KEY }),
  })
}

export function useUpdateFileMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateFileMetaDto) =>
      mediaService.updateFileMeta(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FILES_KEY }),
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mediaService.deleteFile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FILES_KEY }),
  })
}

export function useSignedUrl(id: string | null) {
  return useQuery({
    queryKey: ['media', 'signed-url', id],
    queryFn: () => mediaService.getSignedUrl(id!),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  })
}

export function useMediaFolders() {
  return useQuery({
    queryKey: MEDIA_FOLDERS_KEY,
    queryFn: () => mediaService.listFolders(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateFolderDto) => mediaService.createFolder(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FOLDERS_KEY }),
  })
}

export function useRenameFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      mediaService.renameFolder(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FOLDERS_KEY }),
  })
}

export function useMoveFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      mediaService.moveFolder(id, parentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FOLDERS_KEY }),
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mediaService.deleteFolder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDIA_FOLDERS_KEY }),
  })
}
