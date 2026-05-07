import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { QUERY_KEYS } from '@shared/constants'
import { articleService } from '../services/article.service'
import type { CreateArticleDto, UpdateArticleDto } from '../types'

export function useArticleList(params?: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ARTICLE.LIST, JSON.stringify(params)],
    queryFn: () => articleService.list(params),
    placeholderData: keepPreviousData,
  })
}

export function usePendingArticles(params?: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ARTICLE.PENDING, JSON.stringify(params)],
    queryFn: () => articleService.listPending(params),
    placeholderData: keepPreviousData,
  })
}

export function useArticle(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ARTICLE.DETAIL, id],
    queryFn: () => articleService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateArticleDto) => articleService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST }),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateArticleDto }) =>
      articleService.update(id, dto),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST })
      void qc.invalidateQueries({ queryKey: [...QUERY_KEYS.ARTICLE.DETAIL, id] })
    },
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.PENDING })
    },
  })
}

export function usePublishArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.publish(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.PENDING })
    },
  })
}

export function useUnpublishArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.unpublish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST }),
  })
}

export function useApproveArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.approve(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.PENDING })
    },
  })
}

export function useRejectArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.reject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.LIST })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.PENDING })
    },
  })
}
