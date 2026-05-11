'use client'

import { useState } from 'react'
import { Skeleton } from '@shared/components/ui'
import { BillingHistoryCard } from './BillingHistoryCard'
import { CancelSubscriptionSection } from './CancelSubscriptionSection'
import { CurrentPlanBanner } from './CurrentPlanBanner'
import { PaymentMethodsCard } from './PaymentMethodsCard'
import { UpgradeDialog } from './UpgradeDialog'
import { UpgradePlansSection } from './UpgradePlansSection'
import { UsageStatsGrid } from './UsageStatsGrid'
import {
  useInvoices,
  usePaymentMethods,
  usePlans,
  useSubscription,
  useUpgrade,
  useUsage,
} from '../hooks/useBilling'
import type { BillingPeriod, Plan } from '../types'

export function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription()
  const { data: plans, isLoading: plansLoading } = usePlans()
  const { data: usage, isLoading: usageLoading } = useUsage()
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods()
  const { data: invoices, isLoading: invLoading } = useInvoices()
  const upgrade = useUpgrade()

  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const dialogOpen = selectedPlan !== null

  const isLoading = subLoading || plansLoading || usageLoading || methodsLoading || invLoading

  if (isLoading || !subscription || !plans || !usage || !methods || !invoices) {
    return <BillingSkeleton />
  }

  const proPlan = plans.find((p) => p.id === 'pro')
  const defaultMethod = methods.find((m) => m.isDefault)
  const isCancellable = subscription.planId !== 'free' && subscription.status === 'active'

  const renewalDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toLocaleDateString('vi-VN')
  })()

  const handleConfirmUpgrade = () => {
    if (!selectedPlan || !defaultMethod) return
    upgrade.mutate(
      { planId: selectedPlan.id, period, paymentMethodId: defaultMethod.id },
      {
        onSuccess: () => setSelectedPlan(null),
      },
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Gói đăng ký</h1>
        <p className="text-xs text-muted-foreground">Quản lý gói và thanh toán</p>
      </div>

      <CurrentPlanBanner subscription={subscription} proPlan={proPlan} />

      <UsageStatsGrid stats={usage} />

      <UpgradePlansSection
        plans={plans}
        period={period}
        currentPlanId={subscription.planId}
        onChangePeriod={setPeriod}
        onUpgrade={setSelectedPlan}
      />

      <PaymentMethodsCard methods={methods} />

      <BillingHistoryCard invoices={invoices} />

      <CancelSubscriptionSection isCancellable={isCancellable} />

      <UpgradeDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
        plan={selectedPlan}
        period={period}
        defaultMethod={defaultMethod}
        renewalDate={renewalDate}
        isSubmitting={upgrade.isPending}
        onConfirm={handleConfirmUpgrade}
      />
    </div>
  )
}

function BillingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
