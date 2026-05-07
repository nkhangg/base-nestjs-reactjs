# Module: modules/dictionary

## Mục đích
Kho từ vựng tiếng Nhật do staff và cộng đồng đóng góp. Hỗ trợ tra từ theo kanji/hiragana/romaji, lọc theo JLPT level, workflow kiểm duyệt (pending → approved/rejected). Dữ liệu nguồn cho flashcard module.

## Cấu trúc
```
modules/dictionary/
├── domain/
│   ├── entities/dictionary-entry.entity.ts   # { id, kanji?, hiragana, romaji, meanings[], jlptLevel?, status, isPublic, creatorId?, staffAuthorId?, verifiedBy? }
│   ├── repositories/dictionary.repository.ts  # DICTIONARY_REPOSITORY symbol
│   ├── value-objects/dictionary-entry-id.vo.ts
│   └── events/dictionary-entry-approved.event.ts
├── application/use-cases/
│   ├── create-dictionary-entry.use-case.ts   # user → pending, staff → approved
│   ├── update-dictionary-entry.use-case.ts
│   ├── delete-dictionary-entry.use-case.ts
│   ├── get-dictionary-entry.use-case.ts
│   ├── search-dictionary.use-case.ts         # full-text ILIKE, filter jlptLevel, paginate
│   ├── moderate-dictionary-entry.use-case.ts # approve/reject + emit event
│   └── list-pending-entries.use-case.ts
├── infrastructure/
│   ├── mappers/dictionary.mapper.ts
│   └── repositories/
│       ├── prisma-dictionary.repository.ts
│       └── in-memory-dictionary.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── dictionary-admin.controller.ts   # /admin/dictionary (AdminAuthGuard)
│   │   └── dictionary-admin.feature.ts
│   ├── public/
│   │   └── dictionary-public.controller.ts  # /dictionary (@Public)
│   └── user/
│       └── dictionary-user.controller.ts    # /me/dictionary (AuthGuard)
└── dictionary.module.ts    # Seed DICTIONARY_ROLES on onModuleInit
```

## API Routes

### Admin (`/admin/dictionary`) — AdminAuthGuard + @RequirePermission
| Method | Path | Permission |
|---|---|---|
| POST | `/admin/dictionary` | create |
| GET | `/admin/dictionary/pending` | read |
| GET | `/admin/dictionary` | read |
| GET | `/admin/dictionary/:id` | read |
| PATCH | `/admin/dictionary/:id` | update |
| DELETE | `/admin/dictionary/:id` | delete |
| POST | `/admin/dictionary/:id/approve` | moderate |
| POST | `/admin/dictionary/:id/reject` | moderate |

### Public (`/dictionary`) — @Public()
| Method | Path | Mô tả |
|---|---|---|
| GET | `/dictionary` | search (q, jlptLevel, phân trang) — chỉ approved + isPublic |
| GET | `/dictionary/:id` | get entry by id |

### User (`/me/dictionary`) — AuthGuard
| Method | Path | Mô tả |
|---|---|---|
| POST | `/me/dictionary` | submit entry (→ pending) |

## Seeded Roles
| Role | SubjectType | Permissions |
|---|---|---|
| dictionary-editor | admin | dictionary-management → read, create, update, delete, moderate |
| dictionary-viewer | admin | dictionary-management → read |

## Domain Events Published
- `dictionary.entry_approved` — sau khi admin approve entry (payload: entryId, hiragana, verifiedBy)

## Domain Model
- `entry.approve(adminId)` — set status = approved, verifiedBy = adminId
- `entry.reject(adminId)` — set status = rejected, verifiedBy = adminId
- `entry.update(params)` — update kanji/hiragana/romaji/meanings/jlptLevel/isPublic
- `DictionaryEntry.create({ isStaff })` — isStaff=true → status approved, false → pending

## Dependencies
- Import `EventsModule` (để publish domain events)
- Prisma model: `DictionaryEntry` (@@map "dictionary_entries")
