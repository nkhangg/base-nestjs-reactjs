import { useRef, useState } from 'react'
import { DragDropProvider, DragOverlay, useDragDropMonitor } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react'
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { cn } from '@shared/utils'
import type { EditorEntry } from '../hooks/useJsonObjectEditor'

// ── Card (used both in the list and as the drag overlay) ─────────────────────

interface CardProps {
  entry: EditorEntry
  isExpanded: boolean
  onToggle: () => void
  onKeyChange: (key: string) => void
  onValueChange: (raw: string) => void
  onDelete: () => void
  overlay?: boolean
  gripRef?: (element: Element | null) => void
}

function EntryCard({
  entry,
  isExpanded,
  onToggle,
  onKeyChange,
  onValueChange,
  onDelete,
  overlay = false,
  gripRef,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white',
        entry.keyError || entry.valueError ? 'border-red-300' : 'border-gray-200',
        overlay && 'shadow-xl rotate-1 opacity-90',
      )}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <span
          ref={gripRef}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-gray-300 hover:text-gray-500 transition-colors"
          title="Kéo để sắp xếp"
        >
          <GripVertical className="size-4" />
        </span>

        <div className="flex-1 min-w-0 space-y-0.5">
          <Input
            value={entry.key}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="key-name"
            className={cn(
              'h-7 font-mono text-xs px-2',
              entry.keyError && 'border-red-300 focus-visible:ring-red-300',
            )}
          />
          {entry.keyError && (
            <p className="text-[10px] text-red-500 pl-0.5">{entry.keyError}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 p-1 text-gray-400 hover:text-gray-700 transition-colors rounded"
          title={isExpanded ? 'Thu gọn' : 'Mở rộng để sửa value'}
        >
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors rounded"
          title="Xoá key này"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-1">
          <Textarea
            value={entry.rawValue}
            onChange={(e) => onValueChange(e.target.value)}
            rows={4}
            className={cn(
              'font-mono text-xs resize-y',
              entry.valueError && 'border-red-300 focus-visible:ring-red-300',
            )}
          />
          {entry.valueError && (
            <p className="text-[10px] text-red-500">{entry.valueError}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sortable card wrapper ─────────────────────────────────────────────────────

interface SortableCardProps extends Omit<CardProps, 'overlay' | 'gripRef'> {
  id: string
  index: number
}

function SortableCard({ id, index, ...rest }: SortableCardProps) {
  const { ref, handleRef, isDragSource } = useSortable({ id, index })

  return (
    <div ref={ref} className={cn(isDragSource && 'opacity-40')}>
      <EntryCard {...rest} gripRef={handleRef} />
    </div>
  )
}

// ── Sort monitor (must live inside DragDropProvider) ──────────────────────────
// Tracks the last dragover pair via ref, then commits the reorder in dragend.
// This avoids relying on source.index which may already be reset by the time
// onDragEnd fires on the provider.

interface SortMonitorProps {
  entriesRef: React.RefObject<EditorEntry[]>
  onReorder: (newEntries: EditorEntry[]) => void
}

function SortMonitor({ entriesRef, onReorder }: SortMonitorProps) {
  const pendingRef = useRef<{ sourceId: string; targetId: string } | null>(null)

  useDragDropMonitor<EditorEntry>({
    onDragOver(event: DragOverEvent) {
      const { source, target } = event.operation
      if (!source || !target || source.id === target.id) return
      pendingRef.current = { sourceId: String(source.id), targetId: String(target.id) }
    },
    onDragEnd(event: DragEndEvent) {
      if (!event.canceled && pendingRef.current) {
        const { sourceId, targetId } = pendingRef.current
        const entries = entriesRef.current ?? []
        const fromIdx = entries.findIndex((e) => e.id === sourceId)
        const toIdx = entries.findIndex((e) => e.id === targetId)
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          const next = [...entries]
          next.splice(toIdx, 0, next.splice(fromIdx, 1)[0])
          onReorder(next)
        }
      }
      pendingRef.current = null
    },
  })

  return null
}

// ── Main component ────────────────────────────────────────────────────────────

interface ObjectEditorCardsProps {
  entries: EditorEntry[]
  onReorder: (newEntries: EditorEntry[]) => void
  onUpdateKey: (id: string, key: string) => void
  onUpdateValue: (id: string, raw: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

export function ObjectEditorCards({
  entries,
  onReorder,
  onUpdateKey,
  onUpdateValue,
  onAdd,
  onDelete,
}: ObjectEditorCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Ref so SortMonitor always reads current entries without stale closure
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  return (
    <div>
      <DragDropProvider>
        <SortMonitor entriesRef={entriesRef} onReorder={onReorder} />

        <div className="space-y-2">
          {entries.map((entry, index) => (
            <SortableCard
              key={entry.id}
              id={entry.id}
              index={index}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === entry.id ? null : entry.id))
              }
              onKeyChange={(key) => onUpdateKey(entry.id, key)}
              onValueChange={(raw) => onUpdateValue(entry.id, raw)}
              onDelete={() => {
                if (expandedId === entry.id) setExpandedId(null)
                onDelete(entry.id)
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {(source) => {
            const entry = entries.find((e) => e.id === source.id)
            return entry ? (
              <EntryCard
                entry={entry}
                isExpanded={false}
                onToggle={() => {}}
                onKeyChange={() => {}}
                onValueChange={() => {}}
                onDelete={() => {}}
                overlay
              />
            ) : null
          }}
        </DragOverlay>
      </DragDropProvider>

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-400">Chưa có key nào</p>
          <p className="mt-1 text-xs text-gray-300">Nhấn nút bên dưới để thêm key đầu tiên</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="mt-3 w-full border-dashed text-gray-500 hover:text-gray-700"
      >
        <Plus className="mr-1.5 size-3.5" />
        Thêm key
      </Button>
    </div>
  )
}
