import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@shared/constants'
import { articleService } from '../services/article.service'
import type { CreateCategoryDto, UpdateCategoryDto, CreateTagDto } from '../types'

// ── Categories ─────────────────────────────────────────────────────────────────

export function useCategoryList() {
  return useQuery({
    queryKey: QUERY_KEYS.ARTICLE.CATEGORIES,
    queryFn: () => articleService.listCategories(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => articleService.createCategory(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.CATEGORIES }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) =>
      articleService.updateCategory(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.CATEGORIES }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.CATEGORIES }),
  })
}

// ── Tags ───────────────────────────────────────────────────────────────────────

export function useTagList() {
  return useQuery({
    queryKey: QUERY_KEYS.ARTICLE.TAGS,
    queryFn: () => articleService.listTags(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTagDto) => articleService.createTag(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.TAGS }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleService.deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.ARTICLE.TAGS }),
  })
}
