# Module: modules/media

## Mục đích
File manager đầy đủ: upload, folder hierarchy, grid view, rename/move/delete. Cung cấp `MediaPicker` — Dialog dùng bởi các module khác (blog editor, ...) để chọn file.

## Cấu trúc
```
modules/media/
├── components/
│   ├── MediaPage.tsx          # Main page: sidebar folders + grid files
│   ├── FolderSidebar.tsx      # Folder tree navigation
│   ├── MediaGrid.tsx          # File grid với lazy load thumbnails
│   ├── MediaUploadModal.tsx   # Drag & drop upload
│   ├── MediaEditModal.tsx     # Sửa metadata file
│   ├── FolderFormModal.tsx    # Tạo/rename folder
│   └── MediaPicker.tsx        # Shared Dialog — chọn file cho module khác
├── hooks/
│   └── useMedia.ts            # useMediaFiles, useMediaFolders, useUploadFile,
│                              # useDeleteFile, useUpdateFileMeta, useGetSignedUrl,
│                              # useCreateFolder, useRenameFolder, useMoveFolder, useDeleteFolder
├── services/
│   └── media.service.ts
├── types/
│   └── index.ts               # MediaFile, MediaFolder, FolderNode, StorageType
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/media` | `MediaPage` | `AdminGuard` |

## MediaPicker (cross-module component)
```tsx
import { MediaPicker } from '@modules/media'

<MediaPicker
  open={open}
  onClose={() => setOpen(false)}
  onSelect={(file: MediaFile) => {
    setImageUrl(file.publicUrl)
    setOpen(false)
  }}
  filter="image"   // optional: 'image' | 'video' | 'application' | 'all'
/>
```
`MediaPicker` là Dialog độc lập — hiển thị grid file + folder nav, user click chọn 1 file.

## API Endpoints

### Files
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/media/files` | `useMediaFiles` (paginate + folderId filter) |
| POST | `/admin/media/files/upload` | `useUploadFile` (multipart/form-data) |
| PATCH | `/admin/media/files/:id` | `useUpdateFileMeta` |
| DELETE | `/admin/media/files/:id` | `useDeleteFile` |
| GET | `/admin/media/files/:id/signed-url` | `useGetSignedUrl` |

### Folders
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/media/folders` | `useMediaFolders` |
| POST | `/admin/media/folders` | `useCreateFolder` |
| PATCH | `/admin/media/folders/:id/rename` | `useRenameFolder` |
| PATCH | `/admin/media/folders/:id/move` | `useMoveFolder` |
| DELETE | `/admin/media/folders/:id` | `useDeleteFolder` |

## Query Keys
`QUERY_KEYS.MEDIA.FILES`, `QUERY_KEYS.MEDIA.FOLDERS`
