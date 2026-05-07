'use client'

import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@shared/constants'
import { dashboardService } from '../services/dashboard.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.STATS,
    queryFn: dashboardService.getStats,
  })
}

export function useDashboardModules() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.MODULES,
    queryFn: dashboardService.getModules,
  })
}
