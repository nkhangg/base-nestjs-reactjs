'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@shared/constants'
import { billingService } from '../services/billing.service'
import type { UpgradePayload } from '../types'

export function useSubscription() {
  return useQuery({
    queryKey: QUERY_KEYS.BILLING.SUBSCRIPTION,
    queryFn: billingService.getSubscription,
  })
}

export function usePlans() {
  return useQuery({
    queryKey: QUERY_KEYS.BILLING.PLANS,
    queryFn: billingService.getPlans,
  })
}

export function useUsage() {
  return useQuery({
    queryKey: QUERY_KEYS.BILLING.USAGE,
    queryFn: billingService.getUsage,
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: QUERY_KEYS.BILLING.PAYMENT_METHODS,
    queryFn: billingService.getPaymentMethods,
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: QUERY_KEYS.BILLING.INVOICES,
    queryFn: billingService.getInvoices,
  })
}

export function useUpgrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpgradePayload) => billingService.upgrade(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BILLING.SUBSCRIPTION })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BILLING.USAGE })
      toast.success('🎉 Nâng cấp thành công! Chào mừng bạn lên Pro')
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi nâng cấp. Vui lòng thử lại.')
    },
  })
}
