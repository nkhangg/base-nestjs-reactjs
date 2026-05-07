import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { dictionaryService } from '../services/dictionary.service'
import type { CreateDictionaryEntryDto, RejectDictionaryDto, UpdateDictionaryEntryDto } from '../types'

const DICT_LIST_KEY = ['dictionary', 'list']
const DICT_PENDING_KEY = ['dictionary', 'pending']
const DICT_ENTRY_KEY = ['dictionary', 'entry']

export function useDictionaryList(params?: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...DICT_LIST_KEY, JSON.stringify(params)],
    queryFn: () => dictionaryService.list(params),
    placeholderData: keepPreviousData,
  })
}

export function usePendingDictionary() {
  return useQuery({
    queryKey: DICT_PENDING_KEY,
    queryFn: () => dictionaryService.getPending(),
  })
}

export function useDictionaryEntry(id: string | undefined) {
  return useQuery({
    queryKey: [...DICT_ENTRY_KEY, id],
    queryFn: () => dictionaryService.getById(id!),
    enabled: !!id,
  })
}

export function useCreateDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDictionaryEntryDto) => dictionaryService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DICT_LIST_KEY })
      qc.invalidateQueries({ queryKey: DICT_PENDING_KEY })
    },
  })
}

export function useUpdateDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDictionaryEntryDto }) =>
      dictionaryService.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: DICT_LIST_KEY })
      qc.invalidateQueries({ queryKey: [...DICT_ENTRY_KEY, id] })
    },
  })
}

export function useDeleteDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dictionaryService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DICT_LIST_KEY }),
  })
}

export function useApproveDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dictionaryService.approve(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: DICT_LIST_KEY })
      qc.invalidateQueries({ queryKey: DICT_PENDING_KEY })
      qc.invalidateQueries({ queryKey: [...DICT_ENTRY_KEY, id] })
    },
  })
}

export function useRejectDictionary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: RejectDictionaryDto }) =>
      dictionaryService.reject(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: DICT_LIST_KEY })
      qc.invalidateQueries({ queryKey: DICT_PENDING_KEY })
      qc.invalidateQueries({ queryKey: [...DICT_ENTRY_KEY, id] })
    },
  })
}
