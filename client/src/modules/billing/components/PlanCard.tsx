'use client'

import { Check, X } from 'lucide-react'
import { Button } from '@shared/components/ui'
import { cn, formatNumber } from '@shared/utils'
import type { BillingPeriod, Plan } from '../types'

interface Props {
  plan: Plan
  period: BillingPeriod
  isCurrent: boolean
  onUpgrade: () => void
}

export function PlanCard({ plan, period, isCurrent, onUpgrade }: Props) {
  const price = period === 'annual' ? plan.priceAnnualPerMonth : plan.priceMonthly
  const isHighlighted = plan.popular && !isCurrent

  const note =
    plan.id === 'free'
      ? ''
      : period === 'annual'
        ? `Thanh toán hàng năm (${formatNumber(plan.priceAnnualPerMonth * 12)}₫)`
        : 'Thanh toán hàng tháng'

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-5 transition-all',
        isCurrent
          ? 'border-dashed bg-muted/40'
          : isHighlighted
            ? 'border-foreground shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-foreground'
            : 'border-border hover:border-foreground/30 hover:shadow-sm',
      )}
    >
      {isCurrent ? (
        <span className="absolute -top-3 left-5 rounded-full bg-muted-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
          Gói hiện tại
        </span>
      ) : null}

      {isHighlighted ? (
        <span className="absolute -top-3 right-5 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
          Phổ biến nhất
        </span>
      ) : null}

      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {plan.name}
      </p>

      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-semibold leading-none tracking-tight text-foreground">
          {formatNumber(price)}
        </span>
        <span className="mb-1 text-xs text-muted-foreground">₫/tháng</span>
      </div>

      <p className="mt-1 min-h-[16px] text-[11px] text-muted-foreground">{note || ' '}</p>

      <ul className="mt-4 space-y-2">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full',
                f.included
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {f.included ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
            </span>
            <span
              className={cn(
                f.included ? 'text-foreground/80' : 'text-muted-foreground',
                f.emphasis && 'font-semibold text-foreground',
              )}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {isCurrent ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full opacity-60"
          >
            Đang dùng
          </Button>
        ) : (
          <Button size="sm" className="w-full" onClick={onUpgrade}>
            Nâng cấp lên {plan.name} →
          </Button>
        )}
      </div>
    </div>
  )
}
