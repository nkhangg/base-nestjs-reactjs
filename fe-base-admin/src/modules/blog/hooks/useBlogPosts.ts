import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { blogService } from '../services/blog.service'
import type { CreatePostDto, UpdatePostDto } from '../types'

export const BLOG_POSTS_QUERY_KEY = ['blog', 'posts']

export function useGetPost(id: string | undefined) {
  return useQuery({
    queryKey: ['blog', 'post', id],
    queryFn: () => blogService.getPost(id!),
    enabled: !!id,
  })
}

export function useBlogPosts(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...BLOG_POSTS_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => blogService.listPosts(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePostDto) => blogService.createPost(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_POSTS_QUERY_KEY }),
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePostDto }) =>
      blogService.updatePost(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_POSTS_QUERY_KEY }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => blogService.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_POSTS_QUERY_KEY }),
  })
}

export function usePublishPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => blogService.publishPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_POSTS_QUERY_KEY }),
  })
}

export function useUnpublishPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => blogService.unpublishPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_POSTS_QUERY_KEY }),
  })
}
