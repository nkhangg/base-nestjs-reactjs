import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import type { UpdateConfigDto, CreateConfigDto } from '../types'
import { configService } from '../services/config.service'

export const CONFIGS_QUERY_KEY = ['configs']

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useConfigs(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...CONFIGS_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => configService.listConfigs(params),
    placeholderData: keepPreviousData,
  })
}

export function useConfig(id: string | null) {
  return useQuery({
    queryKey: [...CONFIGS_QUERY_KEY, id],
    queryFn: () => configService.getConfig(id!),
    enabled: !!id,
  })
}

export function useCreateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateConfigDto) => configService.createConfig(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateConfigDto) =>
      configService.updateConfig(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}

export function useToggleConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => configService.toggleConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}

export function useDeleteConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => configService.deleteConfig(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIGS_QUERY_KEY }),
  })
}
