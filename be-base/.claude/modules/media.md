# Module: modules/media

## Mục đích
Quản lý file upload và folder hierarchy. Hỗ trợ 2 storage providers (local / MinIO) chọn qua env. Expose admin CRUD + public URL endpoint.

## Cấu trúc
```
modules/media/
├── domain/
│   ├── entities/
│   │   ├── media-file.entity.ts    # { id, name, mimeType, size, path, folderId, storageType }
│   │   └── media-folder.entity.ts  # { id, name, parentId }
│   └── repositories/
│       ├── media-file.repository.ts    # MEDIA_FILE_REPOSITORY
│       └── media-folder.repository.ts  # MEDIA_FOLDER_REPOSITORY
├── application/
│   ├── ports/storage.provider.ts      # STORAGE_PROVIDER + IStorageProvider interface
│   └── use-cases/
│       ├── upload-file.use-case.ts
│       ├── list-files.use-case.ts
│       ├── get-file.use-case.ts
│       ├── update-file-meta.use-case.ts
│       ├── delete-file.use-case.ts
│       ├── get-signed-url.use-case.ts
│       ├── list-folders.use-case.ts
│       ├── create-folder.use-case.ts
│       ├── rename-folder.use-case.ts
│       ├── move-folder.use-case.ts
│       └── delete-folder.use-case.ts
├── infrastructure/
│   ├── storage/
│   │   ├── local-storage.provider.ts   # Lưu file vào disk
│   │   └── minio-storage.provider.ts   # S3-compatible MinIO
│   └── repositories/
│       ├── prisma-media-file.repository.ts
│       └── prisma-media-folder.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── media-admin.controller.ts   # /admin/media (AdminAuthGuard)
│   │   └── media-admin.feature.ts
│   └── public/
│       └── media-public.controller.ts  # /media/:id (public URL)
└── media.module.ts    # useFactory chọn storage provider, seeds MEDIA_ROLES
```

## API Routes

### Admin (`/admin/media`)
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/media/files` | read |
| POST | `/admin/media/files/upload` | create (multipart/form-data) |
| GET | `/admin/media/files/:id` | read |
| PATCH | `/admin/media/files/:id` | update |
| DELETE | `/admin/media/files/:id` | delete |
| GET | `/admin/media/files/:id/signed-url` | read |
| GET | `/admin/media/folders` | read |
| POST | `/admin/media/folders` | create |
| PATCH | `/admin/media/folders/:id/rename` | update |
| PATCH | `/admin/media/folders/:id/move` | update |
| DELETE | `/admin/media/folders/:id` | delete |

### Public
| Method | Path | Mô tả |
|---|---|---|
| GET | `/media/:id` | Serve file public (redirect hoặc stream) |

## Seeded Roles

| Role | SubjectType | Permissions |
|---|---|---|
| media-manager | admin | media-management → read, create, update, delete |
| media-viewer | admin | media-management → read |

## Storage Provider
```ts
// Chọn qua env STORAGE_TYPE:
process.env.STORAGE_TYPE === 'minio' → MinioStorageProvider
default                              → LocalStorageProvider
```

## Exports
`GetFileUseCase`, `ListFilesUseCase` — dùng bởi các module khác (e.g. Blog lấy thumbnail).

## Domain Events Published
- `media.file.uploaded` — sau khi upload thành công (handler trong IntegrationModule)
