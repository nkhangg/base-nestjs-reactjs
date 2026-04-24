import { Columns3, Eye } from 'lucide-react'
import { cn } from '@shared/utils'
import { Button } from '@shared/components/ui/button'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover'
import { Separator } from '@shared/components/ui/separator'
import type { ColumnDef } from './types'

interface ColumnVisibilityToggleProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  columnVisibility: Record<string, boolean>
  onToggleColumn: (key: string) => void
  onShowAllColumns: () => void
}

export function ColumnVisibilityToggle<T extends Record<string, unknown>>({
  columns,
  columnVisibility,
  onToggleColumn,
  onShowAllColumns,
}: ColumnVisibilityToggleProps<T>) {
  const hideableColumns = columns.filter(col => col.hideable !== false)
  const hiddenCount = hideableColumns.filter(col => columnVisibility[col.key] === false).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 text-xs', hiddenCount > 0 && 'border-primary/60')}
        >
          <Columns3 className="h-3.5 w-3.5" />
          Columns
          {hiddenCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {hiddenCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-0" align="end">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Columns
          </p>
        </div>
        <Separator />

        <div className="max-h-64 overflow-y-auto p-1">
          {hideableColumns.map(col => {
            const visible = columnVisibility[col.key] !== false
            return (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={visible}
                  onCheckedChange={() => onToggleColumn(col.key)}
                  className="h-3.5 w-3.5"
                />
                <span className={cn('truncate', !visible && 'text-muted-foreground')}>
                  {col.header}
                </span>
                {visible && <Eye className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />}
              </label>
            )
          })}
        </div>

        {hiddenCount > 0 && (
          <>
            <Separator />
            <div className="p-1">
              <button
                onClick={onShowAllColumns}
                className="flex w-full items-center justify-center rounded px-2 py-1.5 text-xs font-medium text-primary hover:bg-accent"
              >
                Show all columns
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
