import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { FieldLabel } from '@shared/components/ui/field'

interface RejectReasonDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  isPending?: boolean
  entryLabel?: string
}

export function RejectReasonDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  entryLabel,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Từ chối từ điển
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {entryLabel ?? 'Nhập lý do từ chối (tùy chọn)'}
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <FieldLabel className="text-sm font-medium text-gray-700">
              Lý do từ chối
              <span className="ml-1 text-xs font-normal text-gray-400">(tùy chọn)</span>
            </FieldLabel>
            <Textarea
              placeholder="Ví dụ: Nghĩa không chính xác, thiếu romaji..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              isLoading={isPending}
            >
              {isPending ? 'Đang từ chối...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
