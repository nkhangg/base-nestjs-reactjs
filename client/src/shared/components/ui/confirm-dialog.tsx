'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Trash2 } from 'lucide-react'
import { cn } from '@shared/utils'
import { Button } from './button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog'

export type ConfirmVariant = 'default' | 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  icon?: React.ReactNode
  loading?: boolean
}

const variantMap: Record<
  ConfirmVariant,
  { Icon: React.ElementType; iconCls: string; ringCls: string; btnCls: string }
> = {
  default: {
    Icon: HelpCircle,
    iconCls: 'text-zinc-500',
    ringCls: 'bg-zinc-100',
    btnCls: '',
  },
  danger: {
    Icon: Trash2,
    iconCls: 'text-red-500',
    ringCls: 'bg-red-50',
    btnCls: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white',
  },
  warning: {
    Icon: AlertTriangle,
    iconCls: 'text-amber-500',
    ringCls: 'bg-amber-50',
    btnCls: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400 text-white',
  },
  info: {
    Icon: Info,
    iconCls: 'text-blue-500',
    ringCls: 'bg-blue-50',
    btnCls: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 text-white',
  },
  success: {
    Icon: CheckCircle2,
    iconCls: 'text-emerald-500',
    ringCls: 'bg-emerald-50',
    btnCls: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500 text-white',
  },
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'default',
  icon,
  loading = false,
}: ConfirmDialogProps) {
  const { Icon, iconCls, ringCls, btnCls } = variantMap[variant]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm gap-0 p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center gap-4">
          <div className={cn('flex items-center justify-center rounded-full size-14 shrink-0', ringCls)}>
            {icon ?? <Icon className={cn('size-7', iconCls)} />}
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-base font-semibold text-zinc-900 leading-snug">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-zinc-500 leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t border-zinc-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={cn('flex-1', btnCls)}
            onClick={onConfirm}
            isLoading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
