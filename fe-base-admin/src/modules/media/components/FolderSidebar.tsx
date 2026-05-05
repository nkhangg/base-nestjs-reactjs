import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { ConfirmDialog } from '@shared/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu'
import type { FolderNode } from '../types'

// ── Rename Dialog ─────────────────────────────────────────────────────────────

interface RenameFolderDialogProps {
  open: boolean
  initialName: string
  onClose: () => void
  onConfirm: (name: string) => void
}

function RenameFolderDialog({ open, initialName, onClose, onConfirm }: RenameFolderDialogProps) {
  const [name, setName] = useState(initialName)

  const handleOpen = (o: boolean) => {
    if (o) setName(initialName)
    else onClose()
  }

  const handleConfirm = () => {
    if (name.trim()) onConfirm(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm gap-0 p-0 rounded-2xl">
        <div className="px-6 pt-5 pb-3 space-y-1">
          <DialogTitle className="text-base font-semibold">Đổi tên folder</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">Nhập tên mới</DialogDescription>
        </div>
        <div className="px-6 pb-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
            autoFocus
          />
        </div>
        <div className="flex gap-2 border-t border-zinc-100 px-6 py-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Huỷ</Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={!name.trim()}>Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── FolderItem ────────────────────────────────────────────────────────────────

interface FolderSidebarProps {
  folders: FolderNode[]
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
  onCreateFolder: (parentId?: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
}

interface FolderItemProps {
  node: FolderNode
  depth: number
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
  onCreateFolder: (parentId?: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
}

function FolderItem({
  node,
  depth,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isSelected = selectedFolderId === node.id
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer select-none transition-colors ${
          isSelected
            ? 'bg-zinc-100 text-zinc-900 font-medium'
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        <button
          type="button"
          className="shrink-0 p-0.5 rounded"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
        >
          <ChevronRight
            className={`size-3.5 transition-transform text-zinc-400 ${hasChildren ? '' : 'invisible'} ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        {expanded && hasChildren ? (
          <FolderOpen className="size-3.5 shrink-0 text-amber-500" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-amber-500" />
        )}

        <span className="flex-1 truncate">{node.name}</span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-0.5 rounded hover:bg-zinc-200">
                <MoreHorizontal className="size-3.5 text-zinc-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onCreateFolder(node.id)}>
                <Plus className="size-3.5 mr-2" /> New subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="size-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}

      <RenameFolderDialog
        open={renameOpen}
        initialName={node.name}
        onClose={() => setRenameOpen(false)}
        onConfirm={(name) => { onRenameFolder(node.id, name); setRenameOpen(false) }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { onDeleteFolder(node.id); setDeleteOpen(false) }}
        title="Xoá folder"
        description={`Bạn có chắc muốn xoá folder "${node.name}"? Chỉ xoá được khi folder rỗng.`}
        confirmLabel="Xoá"
        variant="danger"
      />
    </div>
  )
}

// ── FolderSidebar ─────────────────────────────────────────────────────────────

export function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Folders</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => onCreateFolder()}
          title="New folder"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-1 px-1">
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors ${
            selectedFolderId === null
              ? 'bg-zinc-100 text-zinc-900 font-medium'
              : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <FolderOpen className="size-3.5 text-zinc-400" />
          <span>All files</span>
        </div>

        {folders.map((node) => (
          <FolderItem
            key={node.id}
            node={node}
            depth={0}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        ))}
      </div>
    </div>
  )
}
