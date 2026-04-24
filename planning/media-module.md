# Kế hoạch: Module Media

## Context

Module Media cung cấp hệ thống lưu trữ và quản lý file (ảnh, tài liệu, video,...) cho toàn bộ dự án. Mục đích:
- **fe-admin** upload và quản lý media (tạo folder nhiều cấp, đổi tên, di chuyển, xóa)
- **Các module khác** (Config, v.v.) lấy link file nhanh qua `MediaPicker` component
- Hỗ trợ public/private giống Config module
- **Storage Abstraction**: `IStorageProvider` interface cho phép swap Local ↔ MinIO ↔ S3 chỉ bằng env var, không sửa code

---

## Storage Abstraction

```
STORAGE_TYPE=local   → LocalStorageProvider
STORAGE_TYPE=minio   → MinioStorageProvider
STORAGE_TYPE=s3      → S3StorageProvider  (tương lai)
```

**Interface** (`application/ports/storage.provider.ts`):
```typescript
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface UploadResult {
  key: string;          // storage key: "2025/04/uuid.jpg"
  url: string;          // accessible URL
}

export interface IStorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
}
```

**DI trong `media.module.ts`** — swap provider bằng 1 env var:
```typescript
{
  provide: STORAGE_PROVIDER,
  useFactory: (): IStorageProvider => {
    const type = process.env.STORAGE_TYPE ?? 'local';
    if (type === 'minio') return new MinioStorageProvider();
    return new LocalStorageProvider();
  },
}
```

Mọi use-case chỉ inject `STORAGE_PROVIDER` token — không bao giờ dùng class cụ thể.

---

## Prisma Models

```prisma
model MediaFolder {
  id        String        @id
  name      String
  parentId  String?
  parent    MediaFolder?  @relation("FolderTree", fields: [parentId], references: [id])
  children  MediaFolder[] @relation("FolderTree")
  files     MediaFile[]
  createdBy String?       // adminId
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@map("media_folders")
}

model MediaFile {
  id           String       @id
  key          String       @unique   // storage key: "2025/04/uuid.jpg"
  filename     String                 // tên gốc: "hero-banner.jpg"
  mimeType     String                 // "image/jpeg"
  size         Int                    // bytes
  width        Int?                   // chỉ có cho ảnh
  height       Int?
  url          String                 // URL truy cập
  thumbnailKey String?                // key của thumbnail
  thumbnailUrl String?                // URL thumbnail (tạo bởi Sharp)
  alt          String?                // alt text cho ảnh
  scope        String       @default("public")  // 'public' | 'private'
  folderId     String?
  folder       MediaFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
  tags         String[]
  createdBy    String?                // adminId
  updatedBy    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([scope, folderId])
  @@index([mimeType])
  @@map("media_files")
}
```

---

## Cấu trúc Module Backend

```
be-base/src/modules/media/
├── domain/
│   ├── entities/
│   │   ├── media-file.entity.ts         # Extends BaseAggregate
│   │   └── media-folder.entity.ts       # Extends BaseEntity
│   ├── repositories/
│   │   ├── media-file.repository.ts     # Interface + MEDIA_FILE_REPOSITORY symbol
│   │   └── media-folder.repository.ts   # Interface + MEDIA_FOLDER_REPOSITORY symbol
│   └── value-objects/
│       ├── media-file-id.vo.ts
│       └── media-folder-id.vo.ts
│
├── application/
│   ├── ports/
│   │   └── storage.provider.ts          # IStorageProvider interface + STORAGE_PROVIDER token
│   └── use-cases/
│       ├── upload-file.use-case.ts      # buffer → storage → Sharp thumbnail → DB
│       ├── list-files.use-case.ts       # paginated + filter scope/folder/mimeType/tags
│       ├── get-file.use-case.ts         # by id
│       ├── update-file-meta.use-case.ts # rename, tags, alt, folderId, scope
│       ├── delete-file.use-case.ts      # xóa storage (+ thumbnail) + DB
│       ├── get-signed-url.use-case.ts   # URL có thời hạn cho private file
│       ├── list-folders.use-case.ts     # tree structure (recursive children)
│       ├── create-folder.use-case.ts    # có thể có parentId (nhiều cấp)
│       ├── rename-folder.use-case.ts
│       ├── move-folder.use-case.ts      # đổi parentId
│       └── delete-folder.use-case.ts    # chỉ xóa nếu không có file/subfolder
│
├── infrastructure/
│   ├── storage/
│   │   ├── local-storage.provider.ts   # lưu vào be-base/uploads/, serve qua ServeStaticModule
│   │   └── minio-storage.provider.ts   # S3-compatible (npm: minio)
│   ├── mappers/
│   │   └── media.mapper.ts
│   └── repositories/
│       ├── prisma-media-file.repository.ts
│       └── prisma-media-folder.repository.ts
│
├── presentation/
│   ├── admin/
│   │   ├── media-admin.controller.ts   # /admin/media — AdminAuthGuard + RBAC
│   │   └── media-admin.feature.ts      # AdminFeature registration
│   └── public/
│       └── media-public.controller.ts  # /media — @Public(), scope='public' only
│
└── media.module.ts                      # seedRoles on init
```

---

## API Routes

### Admin — `AdminAuthGuard` + `@RequirePermission`

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `POST` | `/admin/media/files/upload` | `media-management` create | Upload file(s) (multipart/form-data) |
| `GET` | `/admin/media/files` | `media-management` read | List files (paginated, filter) |
| `GET` | `/admin/media/files/:id` | `media-management` read | Chi tiết file |
| `PATCH` | `/admin/media/files/:id` | `media-management` update | Cập nhật metadata |
| `DELETE` | `/admin/media/files/:id` | `media-management` delete | Xóa file |
| `GET` | `/admin/media/files/:id/signed-url` | `media-management` read | URL có thời hạn cho private file |
| `GET` | `/admin/media/folders` | `media-management` read | Cây folder (recursive) |
| `POST` | `/admin/media/folders` | `media-management` create | Tạo folder |
| `PATCH` | `/admin/media/folders/:id/rename` | `media-management` update | Đổi tên folder |
| `PATCH` | `/admin/media/folders/:id/move` | `media-management` update | Di chuyển folder (đổi parentId) |
| `DELETE` | `/admin/media/folders/:id` | `media-management` delete | Xóa folder (nếu rỗng) |

> `/admin/media/files/upload` PHẢI khai báo TRƯỚC `/admin/media/files/:id`
> `/admin/media/folders/:id/rename` và `/admin/media/folders/:id/move` PHẢI khai báo TRƯỚC routes chỉ có `:id`

### Public — `@Public()`, không cần auth

| Method | Path | Điều kiện | Mô tả |
|--------|------|-----------|-------|
| `GET` | `/media/files/:key` | `scope='public'` | Redirect/stream public file |

---

## Upload Flow

```
POST /admin/media/files/upload  (multipart/form-data: files[], scope, folderId?, tags?)
  → Multer parse (max 10 files, 10MB/file)
  → UploadFileUseCase (loop mỗi file):
      1. Sinh key: "{year}/{month}/{uuid}.{ext}"
      2. IStorageProvider.upload(key, buffer, mimeType)  → { key, url }
      3. Nếu mimeType bắt đầu 'image/':
           Sharp metadata → { width, height }
           Sharp resize (max 300x300, fit: 'inside') → thumbBuffer
           IStorageProvider.upload(thumbKey, thumbBuffer, mimeType)  → { thumbnailUrl }
      4. MediaFile.create({ key, filename, mimeType, size, width, height, url, thumbnailUrl, scope, folderId, tags })
      5. MediaFileRepository.save(file)
  → Return: MediaFile[]
```

---

## Cấu trúc Module Frontend

```
fe-base-admin/src/modules/media/
├── components/
│   ├── MediaPage.tsx              # Trang chính: FolderSidebar + header + grid/list
│   ├── FolderSidebar.tsx          # Cây folder nhiều cấp: collapse/expand, breadcrumb
│   ├── MediaGrid.tsx              # Grid view: ảnh hiện thumbnail, file khác hiện icon theo type
│   ├── MediaList.tsx              # List view: DataTable (filename, size, type, scope, date)
│   ├── MediaUploadModal.tsx       # Drag & drop (react-dropzone), progress bar, batch upload
│   ├── MediaEditModal.tsx         # Sửa: filename, alt, tags, scope, folder (dropdown)
│   ├── FolderFormModal.tsx        # Tạo/đổi tên folder (+ chọn parent)
│   └── MediaPicker.tsx            # Reusable popup: chọn file → callback(url)
│       # Props: onSelect, accept (filter mimeType), defaultFolderId
├── hooks/
│   ├── useMediaFiles.ts           # useQuery list (server-side paginate + filter)
│   ├── useMediaFile.ts            # useQuery single by id
│   ├── useUploadFile.ts           # useMutation POST /upload, axios onUploadProgress
│   ├── useUpdateFileMeta.ts       # useMutation PATCH :id
│   ├── useDeleteFile.ts           # useMutation DELETE :id
│   ├── useMediaFolders.ts         # useQuery folder tree
│   ├── useCreateFolder.ts         # useMutation POST
│   ├── useRenameFolder.ts         # useMutation PATCH :id/rename
│   ├── useMoveFolder.ts           # useMutation PATCH :id/move
│   └── useDeleteFolder.ts         # useMutation DELETE :id
├── services/
│   └── media.service.ts
├── types/
│   └── index.ts                   # MediaFile, MediaFolder, UploadDto, UpdateFileMetaDto
└── index.ts                       # Export: MediaPage, MediaPicker, hooks, types
```

### Layout MediaPage

```
┌──────────────────────────────────────────────────────────────┐
│ Media Library                              [Grid|List][Upload]│
├────────────────┬─────────────────────────────────────────────┤
│ Folders        │ Type: All|Image|Doc|Video   Scope: All|Pub  │
│                │ Tags: [tag1][tag2]   Search: [_________]    │
│ 📁 homepage    ├─────────────────────────────────────────────┤
│   📁 hero      │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│   📁 banner    │ │ 🖼  │ │ 🖼  │ │ 📄 │ │ 🖼  │ │ 📄 │        │
│ 📁 products    │ │img │ │img │ │doc │ │img │ │pdf │        │
│   📁 catalog   │ └────┘ └────┘ └────┘ └────┘ └────┘        │
│ 📁 documents   │ [Copy URL]  Hover → Edit | Delete           │
│                │                                             │
│ [+ New Folder] │ ← → Page 1/5  (20 items)                   │
└────────────────┴─────────────────────────────────────────────┘
```

### MediaPicker (tích hợp vào các module khác)

```tsx
// Trong ConfigFormModal.tsx — chèn MediaPicker để chọn ảnh nhanh
<MediaPicker
  onSelect={(file) => setValue('imageUrl', file.url)}
  accept={['image/*']}
/>
// → Mở popup media library → chọn file → đóng popup → trả về url
```

---

## RBAC Seeding

```typescript
// media.module.ts — onModuleInit

{ name: 'admin',  subjectType: 'admin', permissions: { 'media-management': ['read','create','update','delete'] } }
{ name: 'viewer', subjectType: 'admin', permissions: { 'media-management': ['read'] } }
// super-admin kế thừa wildcard '*' — đã có sẵn
```

---

## Dependencies cần thêm

```bash
# Backend
cd be-base
npm install multer @nestjs/platform-express sharp
npm install -D @types/multer
# Khi chuyển sang MinIO (thêm sau):
npm install minio

# Frontend
cd fe-base-admin
npm install react-dropzone
```

---

## Files cần chỉnh sửa

| File | Thay đổi |
|------|----------|
| `be-base/prisma/schema.prisma` | Thêm `MediaFile`, `MediaFolder` |
| `be-base/src/app.module.ts` | Import `MediaModule`, `ServeStaticModule` (nếu local storage) |
| `fe-base-admin/src/app/router.tsx` | Thêm route `/admin/media` |
| `fe-base-admin/src/config/routes.ts` | Thêm `ROUTES.ADMIN_MEDIA` |
| `fe-base-admin/src/shared/constants/index.ts` | Thêm `QUERY_KEYS.MEDIA` |
| `fe-base-admin/src/shared/layouts/MainLayout.tsx` | Thêm nav item "Media" |

---

## Thứ tự Implementation

1. **Dependencies** — install multer, sharp, react-dropzone
2. **Prisma schema** — thêm `MediaFile`, `MediaFolder`, chạy `prisma migrate dev --name add-media-module`
3. **IStorageProvider** — interface + `STORAGE_PROVIDER` symbol (`application/ports/storage.provider.ts`)
4. **LocalStorageProvider** — upload → `be-base/uploads/{key}`, serve via `ServeStaticModule`
5. **MinioStorageProvider** — cùng interface, implement đầy đủ để switch được (dùng `minio` package)
6. **Domain layer** — entities (`MediaFile`, `MediaFolder`), VOs, repository interfaces
7. **Prisma repositories** — `PrismaMediaFileRepository`, `PrismaMediaFolderRepository`
8. **Mapper** — `media.mapper.ts`
9. **Use-cases** — upload → list → get → update → delete → signed-url → folder CRUD (11 use-cases)
10. **Presentation (BE)** — `media-admin.controller.ts` + `media-public.controller.ts` + `media-admin.feature.ts`
11. **Module** — `media.module.ts` (seedRoles on init, register storage provider) + import vào `app.module.ts`
12. **Frontend types & service** — `types/index.ts`, `media.service.ts`
13. **Frontend hooks** — 10 hooks (useMediaFiles, useUploadFile, useUpdateFileMeta, useDeleteFile, useMediaFolders + folder CRUD hooks)
14. **Frontend components** — `FolderSidebar`, `MediaGrid`, `MediaList`, `MediaUploadModal`, `MediaEditModal`, `FolderFormModal`, `MediaPicker`
15. **MediaPage** — compose tất cả components
16. **Router & layout** — thêm route `/admin/media` + nav item vào MainLayout

---

## Verification

```bash
# Backend
cd be-base
npm install multer @nestjs/platform-express sharp
npm install -D @types/multer
npx prisma migrate dev --name add-media-module
npm run build          # zero TypeScript errors
npm run start:dev

# Smoke test (STORAGE_TYPE=local)
# Upload ảnh
curl -X POST http://localhost:3000/admin/media/files/upload \
  -H "Authorization: Bearer <admin-token>" \
  -F "files=@/tmp/test.jpg" \
  -F "scope=public"
# → [{ id, url, thumbnailUrl, width, height, ... }]

# List files
curl http://localhost:3000/admin/media/files?limit=10 \
  -H "Authorization: Bearer <admin-token>"

# Public access (scope=public)
curl http://localhost:3000/media/files/{key}
# → 200 stream/redirect

# Tạo folder nhiều cấp
curl -X POST http://localhost:3000/admin/media/folders \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"homepage","parentId":null}'

curl -X POST http://localhost:3000/admin/media/folders \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"hero","parentId":"<homepage-id>"}'

# Di chuyển folder
curl -X PATCH http://localhost:3000/admin/media/folders/<id>/move \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"parentId":"<new-parent-id>"}'

# Signed URL cho private file
curl http://localhost:3000/admin/media/files/<id>/signed-url \
  -H "Authorization: Bearer <admin-token>"
# → { signedUrl: "...", expiresAt: "..." }

# Frontend
cd fe-base-admin
npm install react-dropzone
npm run type-check     # zero errors
npm run lint           # pass
npm run dev
# Vào /admin/media:
#   - Tạo folder homepage → hero (nested)
#   - Upload ảnh vào hero (drag & drop)
#   - Copy URL → paste vào Config module
#   - Toggle scope public/private
#   - Đổi tên folder, di chuyển folder
#   - Xóa file, xóa folder (rỗng)
#   - Thử MediaPicker từ ConfigFormModal
```
