import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { QUERY_KEYS } from '@shared/constants'
import { questionService } from '../services/question.service'
import type { CreateQuestionDto, UpdateQuestionDto } from '../types'

export function useQuestionList(params?: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.QUESTION.LIST, JSON.stringify(params)],
    queryFn: () => questionService.list(params),
    placeholderData: keepPreviousData,
  })
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.QUESTION.ENTRY, id],
    queryFn: () => questionService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateQuestionDto) => questionService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.QUESTION.LIST })
    },
  })
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuestionDto }) =>
      questionService.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.QUESTION.LIST })
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.QUESTION.ENTRY, id] })
    },
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => questionService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.QUESTION.LIST })
    },
  })
}

export function useApproveQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => questionService.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.QUESTION.LIST })
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.QUESTION.ENTRY, id] })
    },
  })
}

export function useRejectQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => questionService.reject(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.QUESTION.LIST })
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.QUESTION.ENTRY, id] })
    },
  })
}
