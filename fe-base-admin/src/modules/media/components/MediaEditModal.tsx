import { useEffect, useState, KeyboardEvent, useRef } from 'react'
import { Pencil, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { FieldLabel } from '@shared/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import type { MediaFile, MediaScope, FolderNode } from '../types'
import { useUpdateFileMeta } from '../hooks/useMedia'

function flattenFolders(nodes: FolderNode[], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id, label: ' '.repeat(depth * 2) + n.name },
    ...flattenFolders(n.children, depth + 1),
  ])
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    else if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1))
  }

  return (
    <div
      className="border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border bg-transparent px-2 py-1 cursor-text"
      onClick={() => ref.current?.focus()}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
          {tag}
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(value.filter((t) => t !== tag)) }}>
            <X className="h-2.5 w-2.5 text-gray-400 hover:text-gray-700" />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (input.trim()) add(input) }}
        placeholder={value.length === 0 ? 'tag1, tag2...' : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

interface MediaEditModalProps {
  open: boolean
  onClose: () => void
  file: MediaFile | null
  folders: FolderNode[]
}

export function MediaEditModal({ open, onClose, file, folders }: MediaEditModalProps) {
  const [filename, setFilename] = useState('')
  const [alt, setAlt] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [scope, setScope] = useState<MediaScope>('public')
  const NONE = '__none__'
  const [folderId, setFolderId] = useState<string>(NONE)

  const updateMeta = useUpdateFileMeta()
  const flatFolders = flattenFolders(folders)

  useEffect(() => {
    if (file) {
      setFilename(file.filename)
      setAlt(file.alt ?? '')
      setTags(file.tags)
      setScope(file.scope)
      setFolderId(file.folderId ?? NONE)
    }
  }, [file])

  const handleSave = () => {
    if (!file) return
    updateMeta.mutate(
      {
        id: file.id,
        filename: filename || undefined,
        alt: alt || null,
        tags,
        scope,
        folderId: folderId === NONE ? null : folderId,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
            <Pencil className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Edit file</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-mono truncate max-w-[260px]">
              {file?.key}
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <FieldLabel>Filename</FieldLabel>
            <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Alt text</FieldLabel>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Image description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel>Scope</FieldLabel>
              <Select value={scope} onValueChange={(v) => setScope(v as MediaScope)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Folder</FieldLabel>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No folder</SelectItem>
                  {flatFolders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Tags</FieldLabel>
            <TagInput value={tags} onChange={setTags} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={updateMeta.isPending}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} isLoading={updateMeta.isPending}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
