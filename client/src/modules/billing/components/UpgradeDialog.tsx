'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui'
import { formatNumber } from '@shared/utils'
import type { BillingPeriod, PaymentMethod, Plan } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan | null
  period: BillingPeriod
  defaultMethod?: PaymentMethod
  renewalDate: string
  isSubmitting: boolean
  onConfirm: () => void
}

export function UpgradeDialog({
  open,
  onOpenChange,
  plan,
  period,
  defaultMethod,
  renewalDate,
  isSubmitting,
  onConfirm,
}: Props) {
  if (!plan) return null

  const price = period === 'annual' ? plan.priceAnnualPerMonth : plan.priceMonthly
  const periodLabel = period === 'annual' ? 'Hàng năm' : 'Hàng tháng'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nâng cấp lên {plan.name} ✨</DialogTitle>
          <DialogDescription>
            Bạn sẽ được lập tức truy cập toàn bộ tính năng {plan.name}. Thanh toán{' '}
            {formatNumber(price)}₫/tháng, huỷ bất cứ lúc nào.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-muted/60 p-4">
          <p className="mb-2 text-xs font-semibold">Tóm tắt đơn hàng</p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Nihongo {plan.name} — {periodLabel}
            </span>
            <span className="font-mono">{formatNumber(price)}₫</span>
          </div>

          <div className="mt-1 flex items-center justify-between text-sm text-teal-700">
            <span>Dùng thử 7 ngày miễn phí</span>
            <span className="font-mono">−{formatNumber(price)}₫</span>
          </div>

          <div className="my-3 h-px bg-border" />

          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Hôm nay thanh toán</span>
            <span className="font-mono text-teal-700">0₫</span>
          </div>

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Sẽ tự động gia hạn {formatNumber(price)}₫/tháng từ {renewalDate}
          </p>
        </div>

        {defaultMethod ? (
          <p className="text-xs text-muted-foreground">
            Thanh toán qua:{' '}
            <strong className="text-foreground">{defaultMethod.label}</strong>
            {' · '}
            <button
              type="button"
              className="font-medium text-teal-700 hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Đổi thẻ
            </button>
          </p>
        ) : null}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button size="sm" onClick={onConfirm} isLoading={isSubmitting}>
            Xác nhận nâng cấp →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
