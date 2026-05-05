import { useState } from 'react'
import { Image, Search, FolderOpen, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { useMediaFiles, useMediaFolders } from '../hooks/useMedia'
import type { MediaFile, FolderNode } from '../types'

type TypeFilter = 'all' | 'image' | 'video' | 'application' | 'text'

const TYPE_OPTIONS: { label: string; value: TypeFilter; mime?: string }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Ảnh', value: 'image', mime: 'image/' },
  { label: 'Video', value: 'video', mime: 'video/' },
  { label: 'Tài liệu', value: 'application', mime: 'application/' },
  { label: 'Văn bản', value: 'text', mime: 'text/' },
]

function FolderTree({
  nodes,
  selected,
  onSelect,
  depth = 0,
}: {
  nodes: FolderNode[]
  selected: string | null
  onSelect: (id: string | null) => void
  depth?: number
}) {
  return (
    <>
      {nodes.map((n) => (
        <div key={n.id}>
          <button
            type="button"
            className={`w-full flex items-center gap-1.5 rounded px-2 py-1 text-xs text-left transition-colors ${
              selected === n.id ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
            style={{ paddingLeft: `${depth * 10 + 8}px` }}
            onClick={() => onSelect(n.id)}
          >
            <FolderOpen className="size-3 text-amber-400 shrink-0" />
            <span className="truncate">{n.name}</span>
          </button>
          {n.children.length > 0 && (
            <FolderTree nodes={n.children} selected={selected} onSelect={onSelect} depth={depth + 1} />
          )}
        </div>
      ))}
    </>
  )
}

export interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect?: (file: MediaFile) => void
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [search, setSearch] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const mimeType = TYPE_OPTIONS.find((o) => o.value === typeFilter)?.mime

  const { data: filesData, isLoading } = useMediaFiles({ page, pageSize: 24, search, folderId, mimeType })
  const { data: folders = [] } = useMediaFolders()

  const handleFileClick = (file: MediaFile) => {
    navigator.clipboard.writeText(file.url)
    toast.success('Đã copy link')
    setCopiedId(file.id)
    setTimeout(() => setCopiedId(null), 2000)
    if (onSelect) {
      onSelect(file)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl gap-0 p-0 rounded-2xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4 pr-12 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900">
            <Image className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Media Library</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Nhấn vào file để copy link
            </DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Folder sidebar */}
          <div className="w-44 shrink-0 border-r border-zinc-100 overflow-y-auto py-2">
            <button
              type="button"
              className={`w-full flex items-center gap-1.5 rounded px-2 py-1 text-xs text-left ${
                folderId === null ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50'
              }`}
              onClick={() => { setFolderId(null); setPage(1) }}
            >
              <FolderOpen className="size-3 text-zinc-400 shrink-0" />
              All files
            </button>
            <FolderTree nodes={folders} selected={folderId} onSelect={(id) => { setFolderId(id); setPage(1) }} />
          </div>

          {/* Files */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search files…"
                  className="pl-7 h-7 text-xs"
                />
              </div>
              {/* Type filter */}
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1) }}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-sm text-zinc-400">
                  Đang tải…
                </div>
              ) : !filesData?.data.length ? (
                <div className="flex items-center justify-center h-full text-sm text-zinc-400">
                  Không có file nào
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {filesData.data.map((file) => {
                    const isImage = file.mimeType.startsWith('image/')
                    const isCopied = copiedId === file.id
                    return (
                      <button
                        key={file.id}
                        type="button"
                        title={file.filename}
                        onClick={() => handleFileClick(file)}
                        className="group relative overflow-hidden rounded-lg border border-zinc-100 transition-all hover:border-zinc-300 hover:shadow-sm"
                      >
                        <div className="flex h-16 w-full items-center justify-center bg-zinc-50">
                          {isImage ? (
                            <img
                              src={file.thumbnailUrl ?? file.url}
                              alt={file.filename}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-[9px] font-mono text-zinc-400 uppercase">
                              {file.mimeType.split('/')[1]?.slice(0, 4)}
                            </span>
                          )}
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          {isCopied ? (
                            <Check className="size-4 text-white" />
                          ) : (
                            <Copy className="size-4 text-white" />
                          )}
                          <span className="text-[9px] text-white">
                            {isCopied ? 'Đã copy' : 'Copy link'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filesData && filesData.meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2 shrink-0">
                <span className="text-xs text-zinc-400">
                  Trang {filesData.meta.currentPage} / {filesData.meta.totalPages}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    ←
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={page >= filesData.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-100 px-6 py-3 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
