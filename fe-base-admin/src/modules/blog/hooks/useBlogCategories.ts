import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { blogService } from '../services/blog.service'
import type { CreateCategoryDto, UpdateCategoryDto } from '../types'

export const BLOG_CATEGORIES_QUERY_KEY = ['blog', 'categories']

export function useBlogCategories(params?: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...BLOG_CATEGORIES_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => blogService.listCategories(params),
    placeholderData: keepPreviousData,
  })
}

export function useBlogCategoriesAll() {
  return useQuery({
    queryKey: [...BLOG_CATEGORIES_QUERY_KEY, 'all'],
    queryFn: () => blogService.listCategories({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCategoryDto) => blogService.createCategory(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_CATEGORIES_QUERY_KEY }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) =>
      blogService.updateCategory(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_CATEGORIES_QUERY_KEY }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => blogService.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BLOG_CATEGORIES_QUERY_KEY }),
  })
}
