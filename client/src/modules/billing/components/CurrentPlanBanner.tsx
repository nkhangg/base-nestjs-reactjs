'use client'

import { formatNumber } from '@shared/utils'
import type { Plan, Subscription } from '../types'

interface Props {
  subscription: Subscription
  proPlan?: Plan
}

export function CurrentPlanBanner({ subscription, proPlan }: Props) {
  const isFree = subscription.planId === 'free'
  const showTeaser = isFree && proPlan

  return (
    <div className="relative grid grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl bg-foreground px-7 py-6 text-background md:grid-cols-[1fr_auto]">
      <span className="pointer-events-none absolute right-40 top-1/2 hidden -translate-y-1/2 select-none font-mono text-7xl text-background/5 md:block">
        {subscription.planName}
      </span>

      <div className="relative">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-background/40">
          Gói hiện tại
        </p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{subscription.planName}</h2>
          <span className="rounded-full bg-background/10 px-2 py-0.5 text-[11px] font-semibold text-background/70">
            Đang dùng
          </span>
        </div>
        <p className="mt-1 text-sm text-background/50">{subscription.tagline}</p>
      </div>

      {showTeaser ? (
        <div className="relative text-right">
          <p className="text-sm text-background/50">Nâng cấp để mở khoá</p>
          <div className="mt-1 flex items-end justify-end gap-1">
            <span className="text-3xl font-semibold tracking-tight">
              {formatNumber(proPlan.priceMonthly)}
            </span>
            <span className="text-sm text-background/40">₫/tháng</span>
          </div>
          <p className="mt-1 text-[11px] text-background/40">
            hoặc {formatNumber(proPlan.priceAnnualPerMonth)}₫/tháng (hàng năm)
          </p>
        </div>
      ) : (
        <div className="relative text-right">
          {subscription.renewalDate ? (
            <p className="text-xs text-background/40">Gia hạn {subscription.renewalDate}</p>
          ) : null}
          <div className="mt-1 flex items-end justify-end gap-1">
            <span className="text-3xl font-semibold tracking-tight">
              {formatNumber(subscription.amount)}
            </span>
            <span className="text-sm text-background/40">₫/tháng</span>
          </div>
        </div>
      )}
    </div>
  )
}
