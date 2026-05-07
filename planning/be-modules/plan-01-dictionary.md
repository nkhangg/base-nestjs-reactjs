# [BE] FEATURE PLAN — MODULE 1: dictionary (Từ điển tiếng Nhật)
> **Ngày:** 06/05/2026

---

## Mục đích

Kho từ vựng tiếng Nhật do staff và cộng đồng đóng góp. Hỗ trợ tra từ theo kanji/hiragana/romaji, lọc theo JLPT level, workflow kiểm duyệt (pending → approved/rejected), và làm nguồn dữ liệu cho flashcard module.

---

## Domain

Files:
- CREATE `be-base/src/modules/dictionary/domain/entities/dictionary-entry.entity.ts`
  — fields: id, kanji, hiragana, romaji, meanings (string[]), jlptLevel, status (pending/approved/rejected), isPublic, creatorId (user), staffAuthorId (admin), verifiedBy (admin), createdAt
- CREATE `be-base/src/modules/dictionary/domain/repositories/dictionary.repository.ts`
  — interface: findById, search(query, jlptLevel, page), findByStatus, create, update, updateStatus, delete
- CREATE `be-base/src/modules/dictionary/domain/events/dictionary-entry-approved.event.ts`

---

## Application

Files:
- CREATE `create-dictionary-entry.use-case.ts` — user/staff tạo từ; user → status `pending`, staff → `approved`
- CREATE `update-dictionary-entry.use-case.ts`
- CREATE `delete-dictionary-entry.use-case.ts`
- CREATE `get-dictionary-entry.use-case.ts`
- CREATE `search-dictionary.use-case.ts` — full-text, filter jlptLevel, paginate
- CREATE `moderate-dictionary-entry.use-case.ts` — staff approve/reject, emit event
- CREATE `list-pending-entries.use-case.ts`

---

## Infrastructure

Files:
- CREATE `be-base/src/modules/dictionary/infrastructure/mappers/dictionary.mapper.ts`
- CREATE `be-base/src/modules/dictionary/infrastructure/repositories/prisma-dictionary.repository.ts`
  — search dùng ILIKE trên kanji/hiragana/romaji/meanings
- CREATE `in-memory-dictionary.repository.ts`

---

## Presentation

**Admin** (`/admin/dictionary`) — AdminAuthGuard + @RequirePermission:

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/dictionary` | read |
| POST | `/admin/dictionary` | create |
| GET | `/admin/dictionary/pending` | read |
| GET | `/admin/dictionary/:id` | read |
| PATCH | `/admin/dictionary/:id` | update |
| DELETE | `/admin/dictionary/:id` | delete |
| POST | `/admin/dictionary/:id/approve` | moderate |
| POST | `/admin/dictionary/:id/reject` | moderate |

**Public** (`/dictionary`) — @Public():

| Method | Path | Mô tả |
|---|---|---|
| GET | `/dictionary` | search (q, jlptLevel, page) |
| GET | `/dictionary/:id` | get entry by id |

**User** (`/me/dictionary`) — AuthGuard (user):

| Method | Path | Mô tả |
|---|---|---|
| POST | `/me/dictionary` | submit entry (→ pending) |

---

## Prisma Schema

```prisma
model DictionaryEntry {
  id            String   @id @default(uuid())
  kanji         String?
  hiragana      String
  romaji        String
  meanings      Json
  jlptLevel     Int?
  status        String   @default("approved")
  isPublic      Boolean  @default(true)
  creatorId     String?
  staffAuthorId String?
  verifiedBy    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  flashcards Flashcard[]

  @@index([hiragana])
  @@index([jlptLevel])
  @@index([status])
  @@map("dictionary_entries")
}
```

**Migration name:** `create_dictionary_entries`

---

## Seeded Roles

| Role | SubjectType | Permissions |
|---|---|---|
| dictionary-editor | admin | dictionary-management → read, create, update, delete, moderate |
| dictionary-viewer | admin | dictionary-management → read |

---

## Edge Cases

- Search dùng ILIKE trên nhiều fields → cần index hợp lý
- User submit → luôn status `pending`, không được tự set `approved`
