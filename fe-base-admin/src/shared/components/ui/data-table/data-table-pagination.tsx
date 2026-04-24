import { cn } from '@shared/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination'
import { buildPageNumbers } from './utils'
import { APP_CONFIG } from '@config/app.config'

// ── Props ─────────────────────────────────────────────────────────────────────

interface DataTablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  loading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = APP_CONFIG.pagination.pageSizeOptions as unknown as number[],
  loading,
}: DataTablePaginationProps) {
  if (loading || total === 0) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageNumbers = buildPageNumbers(page, totalPages)

  const showFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showTo = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">

      {/* Row count */}
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Showing{' '}
        <span className="font-medium text-foreground">{showFrom}–{showTo}</span>
        {' '}of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </span>

      {/* Page navigation */}
      <Pagination className="mx-0 w-auto justify-center">
        <PaginationContent className="gap-0.5">

          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(1)}
              aria-disabled={page === 1}
              className={cn(
                'h-8 w-8 cursor-pointer p-0',
                page === 1 && 'pointer-events-none opacity-40',
              )}
              aria-label="First page"
            >
              «
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              aria-disabled={page === 1}
              className={cn(
                'h-8 cursor-pointer px-2',
                page === 1 && 'pointer-events-none opacity-40',
              )}
            />
          </PaginationItem>

          {pageNumbers.map((num, i) =>
            num === '...' ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis className="h-8 w-8" />
              </PaginationItem>
            ) : (
              <PaginationItem key={num}>
                <PaginationLink
                  isActive={num === page}
                  onClick={() => onPageChange(num as number)}
                  className="h-8 w-8 cursor-pointer p-0"
                >
                  {num}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              aria-disabled={page === totalPages}
              className={cn(
                'h-8 cursor-pointer px-2',
                page === totalPages && 'pointer-events-none opacity-40',
              )}
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(totalPages)}
              aria-disabled={page === totalPages}
              className={cn(
                'h-8 w-8 cursor-pointer p-0',
                page === totalPages && 'pointer-events-none opacity-40',
              )}
              aria-label="Last page"
            >
              »
            </PaginationLink>
          </PaginationItem>

        </PaginationContent>
      </Pagination>

      {/* Page size */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page</span>
        <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[4.5rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(size => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
