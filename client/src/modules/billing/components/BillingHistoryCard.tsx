'use client'

import { toast } from 'sonner'
import { Button, Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@shared/components/ui'
import { cn, formatDate, formatNumber } from '@shared/utils'
import type { Invoice, InvoiceStatus } from '../types'

interface Props {
  invoices: Invoice[]
}

const STATUS_STYLES: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: { label: 'Thành công', className: 'bg-teal-100 text-teal-700' },
  failed: { label: 'Thất bại', className: 'bg-red-100 text-red-700' },
  pending: { label: 'Đang xử lý', className: 'bg-amber-100 text-amber-700' },
}

export function BillingHistoryCard({ invoices }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold">Lịch sử thanh toán</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('📥 Đang tải xuống lịch sử...')}
        >
          Xuất CSV
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chưa có giao dịch nào</EmptyTitle>
            <EmptyDescription>
              Lịch sử thanh toán của bạn sẽ xuất hiện ở đây.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_100px_110px_90px] gap-2 bg-muted/50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Mô tả</span>
            <span>Ngày</span>
            <span className="text-right">Số tiền</span>
            <span className="text-right">Trạng thái</span>
          </div>
          {invoices.map((inv) => {
            const status = STATUS_STYLES[inv.status]
            return (
              <div
                key={inv.id}
                className="grid grid-cols-[1fr_100px_110px_90px] items-center gap-2 border-t border-border px-5 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="text-foreground/80">{inv.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(inv.date, 'dd/MM/yyyy')}
                </span>
                <span className="text-right font-mono text-xs text-foreground">
                  {formatNumber(inv.amount)}₫
                </span>
                <span className="text-right">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
