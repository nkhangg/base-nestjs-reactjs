'use client'

import { toast } from 'sonner'
import { Button } from '@shared/components/ui'

interface Props {
  isCancellable: boolean
}

export function CancelSubscriptionSection({ isCancellable }: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-card p-5">
      <div>
        <p className="text-sm font-medium text-foreground">Huỷ đăng ký</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {isCancellable
            ? 'Bạn vẫn có thể dùng đến hết kỳ thanh toán hiện tại.'
            : 'Hiện bạn đang dùng gói Free. Không có gói nào để huỷ.'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={!isCancellable}
        onClick={() => toast.success('Đã ghi nhận yêu cầu huỷ đăng ký')}
        className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40"
      >
        Huỷ đăng ký
      </Button>
    </div>
  )
}
