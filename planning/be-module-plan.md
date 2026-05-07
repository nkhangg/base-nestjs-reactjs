# [BE] FEATURE PLAN — TỔNG THỂ
> **Module:** Hệ thống học tiếng Nhật — Nihongo Learning
> **Nguồn:** `planning/db-deisgn.dbml` + `planning/page_map_report.md`
> **Ngày:** 06/05/2026

---

## Tóm tắt

Hệ thống hiện tại đã có nền tảng (auth, user, admin, blog, notification, media).
Cần bổ sung 5 module mới cho core learning + 1 module B2B (Phase 2):
`dictionary`, `article`, `question`, `flashcard`, `progress`, `organization`.
Ngoài ra cần mở rộng User entity với XP/streak/settings.

---

## PHẦN 0 — Mở rộng User Model (tiên quyết cho mọi module mới)

### Vấn đề
User Prisma model hiện tại thiếu 3 field cần cho gamification: `xp_total`, `streak_count`, `settings`.

### Thay đổi
- MODIFY `be-base/prisma/schema.prisma` — thêm vào model `User`:
  ```prisma
  xp_total     Int  @default(0)
  streak_count Int  @default(0)
  settings     Json @default("{}")
  ```
- MODIFY `be-base/src/modules/user/domain/entities/user.entity.ts` — thêm fields `xpTotal`, `streakCount`, `settings`
- MODIFY `be-base/src/modules/user/infrastructure/mappers/user.mapper.ts` — map các field mới

**Migration name:** `add_user_gamification_fields`

---

## MODULE 1 — dictionary (Từ điển tiếng Nhật)

**Mục đích:** Kho từ vựng tiếng Nhật do staff và cộng đồng đóng góp. Hỗ trợ tra từ theo kanji/hiragana/romaji, lọc theo JLPT level, workflow kiểm duyệt (pending → approved/rejected), và làm nguồn dữ liệu cho flashcard module.

### Domain
Files:
- CREATE `be-base/src/modules/dictionary/domain/entities/dictionary-entry.entity.ts`
  — fields: id, kanji, hiragana, romaji, meanings (string[]), jlptLevel, status (pending/approved/rejected), isPublic, creatorId (user), staffAuthorId (admin), verifiedBy (admin), createdAt
- CREATE `be-base/src/modules/dictionary/domain/repositories/dictionary.repository.ts`
  — interface: findById, search(query, jlptLevel, page), findByStatus, create, update, updateStatus, delete
- CREATE `be-base/src/modules/dictionary/domain/events/dictionary-entry-approved.event.ts`

### Application
Files:
- CREATE `create-dictionary-entry.use-case.ts` — user/staff tạo từ; user → status `pending`, staff → `approved`
- CREATE `update-dictionary-entry.use-case.ts`
- CREATE `delete-dictionary-entry.use-case.ts`
- CREATE `get-dictionary-entry.use-case.ts`
- CREATE `search-dictionary.use-case.ts` — full-text, filter jlptLevel, paginate
- CREATE `moderate-dictionary-entry.use-case.ts` — staff approve/reject, emit event
- CREATE `list-pending-entries.use-case.ts`

### Infrastructure
Files:
- CREATE `be-base/src/modules/dictionary/infrastructure/mappers/dictionary.mapper.ts`
- CREATE `be-base/src/modules/dictionary/infrastructure/repositories/prisma-dictionary.repository.ts`
  — search dùng ILIKE trên kanji/hiragana/romaji/meanings
- CREATE `in-memory-dictionary.repository.ts`

### Presentation

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

### Prisma schema
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

### Seeded roles

| Role | SubjectType | Permissions |
|---|---|---|
| dictionary-editor | admin | dictionary-management → read, create, update, delete, moderate |
| dictionary-viewer | admin | dictionary-management → read |

---

## MODULE 2 — article (Bài đọc / Đọc hiểu)

**Mục đích:** Kho bài đọc tiếng Nhật với phân loại (categories, tags), tokenization để click-to-lookup, furigana toggle. Khác với blog module (marketing), article phục vụ học viên trực tiếp và có workflow moderation.

### Domain
Files:
- CREATE `be-base/src/modules/article/domain/entities/article.entity.ts`
  — id, title, slug, contentRaw, contentAnnotated (tokenized JSON), level, status (pending/approved/rejected), authorId, staffAuthorId, verifiedBy, createdAt
- CREATE `be-base/src/modules/article/domain/entities/article-category.entity.ts`
  — id, name, slug, colorCode, iconUrl
- CREATE `be-base/src/modules/article/domain/entities/article-tag.entity.ts`
  — id, name
- CREATE repositories cho article, article-category, article-tag
- CREATE `be-base/src/modules/article/domain/events/article-published.event.ts`

### Application
Files:
- CREATE use-cases: create, update, delete, get, list, publish, unpublish, moderate, list-pending
- CREATE category use-cases: create, update, delete, list
- CREATE tag use-cases: create, delete, list

### Infrastructure
Files:
- CREATE `prisma-article.repository.ts` — many-to-many join cho categories và tags qua junction tables
- CREATE mappers, in-memory repos

### Presentation

**Admin** (`/admin/articles`) — CRUD + publish/unpublish + moderate + category/tag CRUD

**Public** (`/articles`) — @Public():

| Method | Path | Mô tả |
|---|---|---|
| GET | `/articles` | list (filter: category, tag, level, page) |
| GET | `/articles/categories` | list categories |
| GET | `/articles/:slug` | get article + annotated content |

### Prisma schema
```prisma
model Article {
  id               String   @id @default(uuid())
  title            String
  slug             String   @unique
  contentRaw       String
  contentAnnotated Json?
  level            Int?
  status           String   @default("pending")
  authorId         String?
  staffAuthorId    String?
  verifiedBy       String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  categories ArticleCategoryMap[]
  tags       ArticleTagMap[]
  questions  Question[]
  progresses UserArticleProgress[]

  @@index([status])
  @@index([level])
  @@map("articles")
}

model ArticleCategory {
  id        String @id @default(uuid())
  name      String
  slug      String @unique
  colorCode String?
  iconUrl   String?

  articles ArticleCategoryMap[]
  @@map("article_categories")
}

model ArticleTag {
  id   String @id @default(uuid())
  name String @unique

  articles ArticleTagMap[]
  @@map("article_tags")
}

model ArticleCategoryMap {
  articleId  String
  categoryId String
  article    Article         @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category   ArticleCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([articleId, categoryId])
  @@map("article_category_maps")
}

model ArticleTagMap {
  articleId String
  tagId     String
  article   Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       ArticleTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("article_tag_maps")
}
```

**Migration name:** `create_articles_and_taxonomy`

---

## MODULE 3 — question (Câu hỏi / Bài tập linh hoạt)

**Mục đích:** Hệ thống câu hỏi đa dạng (quiz, fill_in_blank, matching) liên kết với article hoặc dictionary. Dùng cho ngữ pháp exercises và JLPT mock test.

### Domain
Files:
- CREATE `be-base/src/modules/question/domain/entities/question.entity.ts`
  — id, questionData (JSON: type, prompt, choices, answer, explanation), referenceType (article|dictionary|none), referenceId, status, isPublic, creatorId, staffAuthorId, verifiedBy
- CREATE `be-base/src/modules/question/domain/repositories/question.repository.ts`
  — findById, listByReference(type, id), listByStatus, listForTest(jlptLevel, count, random)

### Application
Files:
- CREATE use-cases: create, update, delete, get, list, moderate
- CREATE `generate-mock-test.use-case.ts` — lấy N câu ngẫu nhiên theo jlptLevel từ approved questions
- CREATE `submit-test-result.use-case.ts` — grade, tính XP, emit activity event

### Infrastructure
Files:
- CREATE `prisma-question.repository.ts`, mapper, in-memory repo

### Presentation

**Admin** (`/admin/questions`) — CRUD + moderate

**Public** (`/questions`) — list by reference

**User** (`/me/mock-test`) — generate test, submit result

### Prisma schema
```prisma
model Question {
  id            String   @id @default(uuid())
  questionData  Json
  referenceType String?
  referenceId   String?
  status        String   @default("approved")
  isPublic      Boolean  @default(true)
  creatorId     String?
  staffAuthorId String?
  verifiedBy    String?
  createdAt     DateTime @default(now())

  @@index([referenceType, referenceId])
  @@index([status])
  @@map("questions")
}
```

**Migration name:** `create_questions`

---

## MODULE 4 — flashcard (Thẻ học SRS)

**Mục đích:** Hệ thống thẻ học Spaced Repetition (thuật toán SM-2) per-user. User tạo flashcard từ dictionary entry, hệ thống lên lịch review tự động.

### Domain
Files:
- CREATE `be-base/src/modules/flashcard/domain/entities/flashcard.entity.ts`
  — id, userId, dictionaryEntryId, interval (days), easeFactor (float), nextReview (timestamp), status (new|learning|mastered), lastReviewedAt
- CREATE `be-base/src/modules/flashcard/domain/services/srs.service.ts`
  — `calculateNextReview(rating: 1-5)` implement SM-2: nếu rating < 3 → reset interval; rating >= 3 → tăng theo easeFactor. easeFactor min = 1.3
- CREATE `be-base/src/modules/flashcard/domain/repositories/flashcard.repository.ts`
  — findDueCards(userId, limit), findById, create, update, delete, listByUser(userId, status, page)

### Application
Files:
- CREATE `add-flashcard.use-case.ts` — thêm word vào deck (prevent duplicate)
- CREATE `get-review-session.use-case.ts` — lấy ≤N cards due today
- CREATE `submit-review.use-case.ts` — nhận rating → update SRS fields, emit activity log (xp += 10 per card)
- CREATE `list-flashcards.use-case.ts` — all user's cards, filter by status
- CREATE `delete-flashcard.use-case.ts`

### Infrastructure
Files:
- CREATE `prisma-flashcard.repository.ts`
  — getDueCards: `WHERE userId = ? AND nextReview <= NOW() AND status != 'mastered'`
- CREATE mapper, in-memory repo (sort by nextReview for due cards)

### Presentation

All routes user-authenticated:

| Method | Path | Mô tả |
|---|---|---|
| POST | `/me/flashcards` | add word to deck |
| GET | `/me/flashcards` | list all cards (filter: status) |
| GET | `/me/flashcards/due` | get review session (today's due) |
| POST | `/me/flashcards/:id/review` | submit rating (1–5) |
| DELETE | `/me/flashcards/:id` | remove card from deck |

### Prisma schema
```prisma
model Flashcard {
  id                String    @id @default(uuid())
  userId            String
  dictionaryEntryId String
  interval          Int       @default(0)
  easeFactor        Float     @default(2.5)
  nextReview        DateTime  @default(now())
  status            String    @default("new")
  lastReviewedAt    DateTime?
  createdAt         DateTime  @default(now())

  dictionaryEntry DictionaryEntry @relation(fields: [dictionaryEntryId], references: [id])

  @@unique([userId, dictionaryEntryId])
  @@index([userId, nextReview])
  @@index([userId, status])
  @@map("flashcards")
}
```

**Migration name:** `create_flashcards`

---

## MODULE 5 — progress (Tiến độ & Gamification)

**Mục đích:** Tracking XP, streak, activity logs, reading progress cho articles, và dashboard analytics. Hub trung tâm tổng hợp dữ liệu từ các module khác.

### Domain
Files:
- CREATE `be-base/src/modules/progress/domain/entities/activity-log.entity.ts`
  — id, userId, actionType (read_article|quiz_done|flashcard_review|login), xpGained, referenceId, createdAt
- CREATE `be-base/src/modules/progress/domain/entities/user-article-progress.entity.ts`
  — userId, articleId, status (reading|completed), lastScrollPosition, completedAt
- CREATE `activity-log.repository.ts` — create, listByUser(userId, from, to), getStreakData(userId)
- CREATE `user-article-progress.repository.ts` — upsert, findByUser(userId, articleId), listByUser
- CREATE `be-base/src/modules/progress/domain/services/streak.service.ts`
  — `calculateStreak(activityDates[])`: đếm ngày liên tiếp từ hôm nay

### Application
Files:
- CREATE `log-activity.use-case.ts` — tạo log + cộng XP vào `users.xp_total` (atomic increment) + update `streak_count`
- CREATE `get-dashboard.use-case.ts` — xp, streak, due flashcards count, recent activity, article progress
- CREATE `get-detailed-progress.use-case.ts` — biểu đồ theo kỹ năng, XP timeline, heatmap data (activity by day)
- CREATE `update-article-progress.use-case.ts` — upsert reading position/status
- CREATE `get-leaderboard.use-case.ts` — top users by xp_total (weekly/all-time)

### Infrastructure
Files:
- CREATE `prisma-activity-log.repository.ts`
- CREATE `prisma-user-article-progress.repository.ts`
- CREATE mappers, in-memory repos

### Presentation

**User routes:**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/me/dashboard` | dashboard overview |
| GET | `/me/progress` | detailed progress + heatmap data |
| POST | `/me/articles/:id/progress` | update scroll position / mark done |
| GET | `/me/articles/:id/progress` | get reading progress |

**Public:**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/leaderboard` | top 50 users by XP (@Public) |

**Admin:**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/progress/users/:id` | view any user's activity log |

### Prisma schema
```prisma
model ActivityLog {
  id          String   @id @default(uuid())
  userId      String
  actionType  String
  xpGained    Int      @default(0)
  referenceId String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@map("activity_logs")
}

model UserArticleProgress {
  userId             String
  articleId          String
  status             String   @default("reading")
  lastScrollPosition Int      @default(0)
  completedAt        DateTime?

  @@id([userId, articleId])
  @@index([userId])
  @@map("user_article_progresses")
}
```

**Migration name:** `create_progress_tables`

---

## MODULE 6 — organization (B2B — Phase 2)

**Mục đích:** Hỗ trợ trường/trung tâm tiếng Nhật tạo lớp học, quản lý học viên, phân công bài tập và xem báo cáo tiến độ nhóm.

### Domain
Files:
- CREATE `be-base/src/modules/organization/domain/entities/organization.entity.ts` — id, name, ownerId, createdAt
- CREATE `be-base/src/modules/organization/domain/entities/classroom.entity.ts` — id, orgId, teacherId, name, inviteCode, createdAt
- CREATE `be-base/src/modules/organization/domain/entities/classroom-member.entity.ts` — classroomId, userId, joinedAt
- CREATE repositories cho organization, classroom, classroom-member

### Application
Files:
- CREATE `create-organization`, `get-organization`, `update-organization` use-cases
- CREATE `create-classroom`, `list-classrooms`, `get-classroom` use-cases
- CREATE `join-classroom-by-code.use-case.ts` — validate inviteCode, add member
- CREATE `get-classroom-report.use-case.ts` — aggregate progress data của members
- CREATE `remove-member.use-case.ts`

### Infrastructure + Presentation
- Teacher routes: `/teacher/organizations`, `/teacher/classrooms`
- Student routes: `/me/classrooms`

### Prisma schema
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  ownerId   String
  createdAt DateTime @default(now())

  classrooms Classroom[]
  @@map("organizations")
}

model Classroom {
  id         String   @id @default(uuid())
  orgId      String
  teacherId  String
  name       String
  inviteCode String   @unique
  createdAt  DateTime @default(now())

  org     Organization    @relation(fields: [orgId], references: [id])
  members ClassroomMember[]

  @@map("classrooms")
}

model ClassroomMember {
  classroomId String
  userId      String
  joinedAt    DateTime @default(now())

  classroom Classroom @relation(fields: [classroomId], references: [id], onDelete: Cascade)

  @@id([classroomId, userId])
  @@map("classroom_members")
}
```

**Migration name:** `create_organizations_and_classrooms`

---

## Thứ tự implement theo độ ưu tiên

| # | Module / Feature | Lý do ưu tiên |
|---|---|---|
| 1 | User model expansion (xp/streak/settings) | Tiên quyết cho progress |
| 2 | **dictionary** | Nền tảng cho flashcard và article lookup |
| 3 | **flashcard** | Core learning — đã có design Phase 1 |
| 4 | **article** | Core learning — Đọc hiểu Phase 1/2 |
| 5 | **question** | Mock test JLPT + ngữ pháp exercises |
| 6 | **progress** | Dashboard, XP, streak, heatmap |
| 7 | **organization** | B2B Phase 2 — sau khi core stable |

---

## Edge cases & risks

- **Duplicate flashcard:** POST `/me/flashcards` phải check unique (userId, dictionaryEntryId) trước khi tạo — dùng `@@unique` constraint + catch Prisma P2002.
- **XP race condition:** Nhiều actions đồng thời cùng user cộng XP → dùng Prisma atomic `increment`, không `findFirst` rồi `update`.
- **Article tokenization:** `contentAnnotated` (JSONB) có thể rất lớn — chỉ trả về trong GET single article, không trong list endpoint.
- **SM-2 algorithm:** `easeFactor` không được xuống dưới 1.3 — cần validation trong domain service.
- **Leaderboard performance:** `ORDER BY xp_total DESC` trên bảng users lớn cần index — thêm `@@index([xpTotal])` vào User model.
- **Invite code collision:** Classroom invite code phải unique globally — dùng `nanoid(8)` + retry nếu gặp P2002.
- **B2B role seeding:** Teacher role cần permission riêng (subjectType `user`) để không conflict với member role.
- **Circular dependency:** progress module cần flashcard data (đếm due cards) → tránh circular bằng cách dùng domain event hoặc query trực tiếp qua Prisma client shared.

---

## Effort estimate

| Module | Domain | Application | Infrastructure | Presentation | Total |
|---|---|---|---|---|---|
| User expansion | Low | Low | Low | Low | **Low** |
| dictionary | Medium | Medium | Medium | Medium | **Medium** |
| article | Medium | High | Medium | Medium | **High** |
| question | Low | Medium | Low | Low | **Medium** |
| flashcard | Medium | Medium | Low | Low | **Medium** |
| progress | Medium | High | Medium | Medium | **High** |
| organization | Medium | Medium | Medium | Medium | **Medium** |
| **TOTAL** | — | — | — | — | **~6–8 tuần** |

---

## Checklist khi implement

- [ ] Chạy migrations theo thứ tự: user_expansion → dictionary → articles → questions → flashcards → progress → organizations
- [ ] Mỗi module mới phải có `InMemory` repo để test không cần DB
- [ ] Tất cả admin routes có `@RequirePermission` và seed role tương ứng
- [ ] Static routes khai báo TRƯỚC param routes (`/due` trước `/:id`, `/pending` trước `/:id`)
- [ ] `contentAnnotated` không trả về trong list endpoints của article
- [ ] SM-2 `easeFactor` có validation min 1.3 trong domain service
- [ ] XP increment dùng Prisma atomic `increment`
- [ ] Sau mỗi module: tạo file `be-base/.claude/modules/<module-name>.md`
- [ ] All new imports use relative paths
- [ ] No domain layer files import from NestJS or Prisma
- [ ] New DTO fields have `@ApiProperty` decorators

---

> Để implement từng module, chạy:
> ```
> /be-add-feature dictionary  <feature description>
> /be-add-feature article     <feature description>
> /be-add-feature question    <feature description>
> /be-add-feature flashcard   <feature description>
> /be-add-feature progress    <feature description>
> /be-add-feature organization <feature description>
> ```
