'use client'

import { toast } from 'sonner'
import { Button } from '@shared/components/ui'
import { cn } from '@shared/utils'
import type { PaymentMethod, PaymentMethodBrand } from '../types'

interface Props {
  methods: PaymentMethod[]
}

const BRAND_STYLES: Record<PaymentMethodBrand, { label: string; bg: string; fontSize: string }> = {
  visa: { label: 'VISA', bg: 'bg-foreground', fontSize: 'text-[11px]' },
  mastercard: { label: 'MC', bg: 'bg-orange-500', fontSize: 'text-[11px]' },
  momo: { label: 'MoMo', bg: 'bg-pink-600', fontSize: 'text-[9px]' },
  zalopay: { label: 'Zalo', bg: 'bg-sky-600', fontSize: 'text-[9px]' },
}

export function PaymentMethodsCard({ methods }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Phương thức thanh toán</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('💳 Tính năng thêm thẻ sắp ra mắt')}
        >
          + Thêm phương thức
        </Button>
      </div>

      <div className="space-y-3">
        {methods.map((m) => {
          const brand = BRAND_STYLES[m.brand]
          return (
            <div
              key={m.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border-[1.5px] border-border/80 px-4 py-3',
                m.disabled && 'opacity-50',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-10 shrink-0 items-center justify-center rounded font-mono font-bold tracking-wider text-background',
                  brand.bg,
                  brand.fontSize,
                )}
              >
                {brand.label}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-[11px] text-muted-foreground">{m.meta}</p>
              </div>
              {m.isDefault ? (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                  Mặc định
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
