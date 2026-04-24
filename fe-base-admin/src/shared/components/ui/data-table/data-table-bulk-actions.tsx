import { X } from 'lucide-react'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Separator } from '@shared/components/ui/separator'
import type { BulkAction } from './types'

interface DataTableBulkActionsProps<T> {
  selectedCount: number
  selectedRows: T[]
  actions: BulkAction<T>[]
  onClearSelection: () => void
}

export function DataTableBulkActions<T>({
  selectedCount,
  selectedRows,
  actions,
  onClearSelection,
}: DataTableBulkActionsProps<T>) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
      {/* Count + deselect */}
      <button
        type="button"
        onClick={onClearSelection}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
      >
        <X className="h-3.5 w-3.5" />
        <span>{selectedCount} selected</span>
      </button>

      <Separator orientation="vertical" className="h-4" />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {actions.map(action => (
          <Button
            key={action.key}
            variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
            size="sm"
            className={cn('h-7 gap-1.5 text-xs', action.variant !== 'destructive' && 'border-input')}
            onClick={() => action.onClick(selectedRows)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
