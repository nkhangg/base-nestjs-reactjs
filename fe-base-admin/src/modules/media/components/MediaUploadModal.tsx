import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { useUploadFile } from '../hooks/useMedia'

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface MediaUploadModalProps {
  open: boolean
  onClose: () => void
  folderId?: string | null
}

export function MediaUploadModal({ open, onClose, folderId }: MediaUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [scope, setScope] = useState<'public' | 'private'>('public')
  const upload = useUploadFile()

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024,
  })

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const handleUpload = () => {
    if (files.length === 0) return
    upload.mutate(
      { files, options: { scope, folderId: folderId ?? undefined } },
      {
        onSuccess: () => {
          setFiles([])
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setFiles([]); onClose() } }}>
      <DialogContent className="max-w-lg gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
            <UploadCloud className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Upload files</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Max 10 files, 10 MB each
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
              isDragActive ? 'border-zinc-800 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="size-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              {isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to select'}
            </p>
          </div>

          {/* Scope */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-700">Scope:</span>
            {(['public', 'private'] as const).map((s) => (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  value={s}
                  checked={scope === s}
                  onChange={() => setScope(s)}
                  className="accent-zinc-900"
                />
                <span className="text-sm capitalize text-zinc-600">{s}</span>
              </label>
            ))}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                  {upload.isPending ? (
                    <Loader2 className="size-4 text-zinc-400 animate-spin" />
                  ) : upload.isSuccess ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : upload.isError ? (
                    <AlertCircle className="size-4 text-red-500" />
                  ) : null}
                  <span className="flex-1 truncate text-zinc-700">{f.name}</span>
                  <span className="text-xs text-zinc-400">{formatBytes(f.size)}</span>
                  {!upload.isPending && (
                    <button onClick={() => removeFile(i)} className="text-zinc-400 hover:text-zinc-700">
                      <X className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { setFiles([]); onClose() }}
              disabled={upload.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={files.length === 0}
              isLoading={upload.isPending}
            >
              {upload.isPending ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
