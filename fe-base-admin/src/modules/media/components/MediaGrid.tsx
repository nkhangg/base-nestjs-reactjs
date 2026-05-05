import { useState } from 'react'
import { FileText, Video, Music, File, MoreHorizontal, Pencil, Trash2, Copy, Lock } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import type { MediaFile } from '../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('video/')) return <Video className="size-8 text-purple-400" />
  if (mimeType.startsWith('audio/')) return <Music className="size-8 text-green-400" />
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text'))
    return <FileText className="size-8 text-blue-400" />
  return <File className="size-8 text-zinc-400" />
}

interface MediaGridProps {
  files: MediaFile[]
  onEdit: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onSelect?: (file: MediaFile) => void
}

export function MediaGrid({ files, onEdit, onDelete, onSelect }: MediaGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)

  const copyUrl = (file: MediaFile) => {
    void navigator.clipboard.writeText(file.url)
    setCopiedId(file.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <File className="size-10 mb-3" />
        <p className="text-sm">No files found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {files.map((file) => {
        const isImage = file.mimeType.startsWith('image/')
        return (
          <div
            key={file.id}
            className={`group relative flex flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white transition-shadow hover:shadow-md ${
              onSelect ? 'cursor-pointer' : ''
            }`}
            onClick={() => onSelect?.(file)}
          >
            {/* Preview */}
            <div className="relative flex h-28 items-center justify-center overflow-hidden bg-zinc-50">
              {isImage ? (
                <img
                  src={file.thumbnailUrl ?? file.url}
                  alt={file.alt ?? file.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <FileIcon mimeType={file.mimeType} />
              )}
              {file.scope === 'private' && (
                <div className="absolute top-1.5 right-1.5">
                  <Lock className="size-3.5 text-zinc-500 bg-white/80 rounded p-0.5" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-1 p-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-800">{file.filename}</p>
                <p className="text-[10px] text-zinc-400">{formatBytes(file.size)}</p>
              </div>

              {!onSelect && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-3.5 text-zinc-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => copyUrl(file)}>
                      <Copy className="size-3.5 mr-2" />
                      {copiedId === file.id ? 'Copied!' : 'Copy URL'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(file)}>
                      <Pencil className="size-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteTarget(file)}
                    >
                      <Trash2 className="size-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )
      })}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null) }}
        title="Xoá file"
        description={`Bạn có chắc muốn xoá "${deleteTarget?.filename}"?`}
        confirmLabel="Xoá"
        variant="danger"
      />
    </div>
  )
}
