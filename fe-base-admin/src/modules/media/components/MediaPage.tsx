import { useState } from 'react'
import { Upload, Search, RefreshCw } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import {
  useMediaFiles,
  useMediaFolders,
  useDeleteFile,
  useRenameFolder,
  useDeleteFolder,
} from '../hooks/useMedia'
import { FolderSidebar } from './FolderSidebar'
import { MediaGrid } from './MediaGrid'
import { MediaUploadModal } from './MediaUploadModal'
import { MediaEditModal } from './MediaEditModal'
import { FolderFormModal } from './FolderFormModal'
import type { MediaFile, MediaScope } from '../types'

export function MediaPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const ALL = '__all__'
  const [scope, setScope] = useState(ALL)
  const [mimeTypeFilter, setMimeTypeFilter] = useState(ALL)
  const [page, setPage] = useState(1)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editFile, setEditFile] = useState<MediaFile | null>(null)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderParentId, setFolderParentId] = useState<string | undefined>()

  const { data: filesData, isLoading, refetch } = useMediaFiles({
    folderId: selectedFolderId,
    search: search || undefined,
    scope: scope === ALL ? undefined : (scope as MediaScope),
    mimeType: mimeTypeFilter === ALL ? undefined : mimeTypeFilter,
    page,
    pageSize: 30,
  })

  const { data: folders = [] } = useMediaFolders()
  const deleteFile = useDeleteFile()
  const renameFolder = useRenameFolder()
  const deleteFolder = useDeleteFolder()

  const handleFolderSelect = (id: string | null) => {
    setSelectedFolderId(id)
    setPage(1)
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Media Library</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {filesData ? `${filesData.meta.totalItems} files` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void refetch()} className="h-8 w-8 p-0">
            <RefreshCw className="size-3.5" />
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
            <Upload className="size-3.5" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folder sidebar */}
        <aside className="hidden w-52 shrink-0 border-r border-zinc-100 bg-white lg:flex flex-col">
          <FolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleFolderSelect}
            onCreateFolder={(parentId) => {
              setFolderParentId(parentId)
              setFolderModalOpen(true)
            }}
            onRenameFolder={(id, name) => renameFolder.mutate({ id, name })}
            onDeleteFolder={(id) => deleteFolder.mutate(id)}
          />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50">
          {/* Filters */}
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-white px-4 py-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search files…"
                className="pl-7 h-8 text-sm"
              />
            </div>

            <Select value={mimeTypeFilter} onValueChange={(v) => { setMimeTypeFilter(v); setPage(1) }}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                <SelectItem value="image/">Images</SelectItem>
                <SelectItem value="video/">Videos</SelectItem>
                <SelectItem value="application/pdf">PDF</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scope} onValueChange={(v) => { setScope(v); setPage(1) }}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="All scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All scopes</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-sm text-zinc-400">Loading…</div>
            ) : (
              <MediaGrid
                files={filesData?.data ?? []}
                onEdit={setEditFile}
                onDelete={(file) => deleteFile.mutate(file.id)}
              />
            )}
          </div>

          {/* Pagination */}
          {filesData && filesData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 bg-white px-4 py-2">
              <span className="text-xs text-zinc-500">
                Page {filesData.meta.currentPage} / {filesData.meta.totalPages}
                {' '}({filesData.meta.totalItems} items)
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={page >= filesData.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <MediaUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={selectedFolderId}
      />

      <MediaEditModal
        open={!!editFile}
        onClose={() => setEditFile(null)}
        file={editFile}
        folders={folders}
      />

      <FolderFormModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        parentId={folderParentId}
        folders={folders}
      />
    </div>
  )
}
