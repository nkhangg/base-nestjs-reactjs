import { Download } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { exportToCsv } from './utils'
import type { ColumnDef } from './types'

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnDef<T>[]
  filename?: string
  onExport?: (data: T[], format: 'csv') => void
  disabled?: boolean
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename = 'export',
  onExport,
  disabled,
}: ExportButtonProps<T>) {
  function handleExport() {
    if (onExport) {
      onExport(data, 'csv')
      return
    }

    // Client-side CSV — skip columns that have no meaningful key (e.g. actions)
    const exportableColumns = columns.filter(
      col => col.key && !col.key.startsWith('_') && col.header,
    )
    exportToCsv(
      data as Record<string, unknown>[],
      exportableColumns.map(col => ({ key: col.key, label: col.header })),
      filename,
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs"
      onClick={handleExport}
      disabled={disabled || data.length === 0}
    >
      <Download className="h-3.5 w-3.5" />
      Export
    </Button>
  )
}
