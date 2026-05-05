import { useState, useEffect } from 'react'
import { FolderPlus } from 'lucide-react'
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
import type { FolderNode } from '../types'
import { useCreateFolder } from '../hooks/useMedia'

function flattenFolders(nodes: FolderNode[], depth = 0): { id: string; label: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id, label: '  '.repeat(depth) + n.name },
    ...flattenFolders(n.children, depth + 1),
  ])
}

interface FolderFormModalProps {
  open: boolean
  onClose: () => void
  parentId?: string
  folders: FolderNode[]
}

const NONE = '__none__'

export function FolderFormModal({ open, onClose, parentId, folders }: FolderFormModalProps) {
  const [name, setName] = useState('')
  const [selectedParent, setSelectedParent] = useState<string>(parentId ?? NONE)
  const createFolder = useCreateFolder()
  const flatFolders = flattenFolders(folders)

  useEffect(() => {
    if (open) {
      setName('')
      setSelectedParent(parentId ?? NONE)
    }
  }, [open, parentId])

  const handleCreate = () => {
    if (!name.trim()) return
    createFolder.mutate(
      { name: name.trim(), parentId: selectedParent === NONE ? undefined : selectedParent },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm gap-0 p-0 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 pr-12">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
            <FolderPlus className="h-4 w-4 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">New folder</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create a new folder
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <FieldLabel>Folder name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. homepage"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Parent folder</FieldLabel>
            <Select value={selectedParent} onValueChange={setSelectedParent}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Root (no parent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Root (no parent)</SelectItem>
                {flatFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={createFolder.isPending}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreate} isLoading={createFolder.isPending} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
