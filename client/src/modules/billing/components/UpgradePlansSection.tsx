'use client'

import { cn } from '@shared/utils'
import { PlanCard } from './PlanCard'
import type { BillingPeriod, BillingPlanId, Plan } from '../types'

interface Props {
  plans: Plan[]
  period: BillingPeriod
  currentPlanId: BillingPlanId
  onChangePeriod: (period: BillingPeriod) => void
  onUpgrade: (plan: Plan) => void
}

const TOGGLE_OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'annual', label: 'Hàng năm' },
]

export function UpgradePlansSection({
  plans,
  period,
  currentPlanId,
  onChangePeriod,
  onUpgrade,
}: Props) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Chọn gói
        </p>

        <div className="flex items-center gap-3">
          <div className="inline-flex gap-0.5 rounded-full bg-muted p-0.5">
            {TOGGLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangePeriod(opt.value)}
                className={cn(
                  'rounded-full px-4 py-1 text-xs font-medium transition-colors',
                  period === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {period === 'annual' ? (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
              Tiết kiệm 40%
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            isCurrent={plan.id === currentPlanId}
            onUpgrade={() => onUpgrade(plan)}
          />
        ))}
      </div>
    </section>
  )
}
