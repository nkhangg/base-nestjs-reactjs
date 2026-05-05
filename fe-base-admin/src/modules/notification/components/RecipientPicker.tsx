import { useState } from 'react'
import { X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@shared/components/ui/input'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Badge } from '@shared/components/ui/badge'
import { Spinner } from '@shared/components/ui/spinner'
import { useDebounce } from '@shared/hooks/useDebounce'
import { notificationService } from '../services/notification.service'

interface Props {
  type: 'admin' | 'user'
  value: string[]
  onChange: (ids: string[]) => void
  error?: string
}

export function RecipientPicker({ type, value, onChange, error }: Props) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Cache email labels for selected IDs that may not be in current search results
  const [labelCache, setLabelCache] = useState<Record<string, string>>({})

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recipient-picker', type, debouncedSearch],
    queryFn: () => notificationService.searchRecipients(type, debouncedSearch || undefined),
    staleTime: 30_000,
  })

  const toggle = (id: string, email: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      setLabelCache((prev) => ({ ...prev, [id]: email }))
      onChange([...value, id])
    }
  }

  const remove = (id: string) => onChange(value.filter((x) => x !== id))

  const label = (id: string) =>
    items.find((i) => i.id === id)?.email ?? labelCache[id] ?? id

  const placeholder =
    type === 'admin' ? 'Tìm admin theo email...' : 'Tìm user theo email...'

  return (
    <div className="space-y-2">
      <Input
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      {/* Scrollable list */}
      <div className="max-h-[180px] overflow-y-auto rounded-md border">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Spinner className="size-4" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {debouncedSearch ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
          </p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50"
          >
            <Checkbox
              id={`rp-${item.id}`}
              checked={value.includes(item.id)}
              onCheckedChange={() => toggle(item.id, item.email)}
            />
            <label htmlFor={`rp-${item.id}`} className="flex-1 cursor-pointer truncate">
              {item.email}
            </label>
            {!item.isActive && (
              <span className="shrink-0 text-[10px] text-muted-foreground">(inactive)</span>
            )}
          </div>
        ))}
      </div>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
              <span className="max-w-[140px] truncate">{label(id)}</span>
              <button
                type="button"
                onClick={() => remove(id)}
                className="ml-0.5 rounded-full hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
