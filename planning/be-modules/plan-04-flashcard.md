# [BE] FEATURE PLAN — MODULE 4: flashcard (Thẻ học SRS)
> **Ngày:** 06/05/2026

---

## Mục đích

Hệ thống thẻ học Spaced Repetition (thuật toán SM-2) per-user. User tạo flashcard từ dictionary entry, hệ thống lên lịch review tự động.

---

## Domain

Files:
- CREATE `be-base/src/modules/flashcard/domain/entities/flashcard.entity.ts`
  — id, userId, dictionaryEntryId, interval (days), easeFactor (float), nextReview (timestamp), status (new|learning|mastered), lastReviewedAt
- CREATE `be-base/src/modules/flashcard/domain/services/srs.service.ts`
  — `calculateNextReview(rating: 1-5)` implement SM-2:
    - rating < 3 → reset interval
    - rating >= 3 → tăng theo easeFactor
    - easeFactor min = **1.3**
- CREATE `be-base/src/modules/flashcard/domain/repositories/flashcard.repository.ts`
  — findDueCards(userId, limit), findById, create, update, delete, listByUser(userId, status, page)

---

## Application

Files:
- CREATE `add-flashcard.use-case.ts` — thêm word vào deck (prevent duplicate)
- CREATE `get-review-session.use-case.ts` — lấy ≤N cards due today
- CREATE `submit-review.use-case.ts` — nhận rating → update SRS fields, emit activity log (xp += 10 per card)
- CREATE `list-flashcards.use-case.ts` — all user's cards, filter by status
- CREATE `delete-flashcard.use-case.ts`

---

## Infrastructure

Files:
- CREATE `prisma-flashcard.repository.ts`
  — getDueCards: `WHERE userId = ? AND nextReview <= NOW() AND status != 'mastered'`
- CREATE mapper, in-memory repo (sort by nextReview for due cards)

---

## Presentation

All routes user-authenticated:

| Method | Path | Mô tả |
|---|---|---|
| POST | `/me/flashcards` | add word to deck |
| GET | `/me/flashcards` | list all cards (filter: status) |
| GET | `/me/flashcards/due` | get review session (today's due) |
| POST | `/me/flashcards/:id/review` | submit rating (1–5) |
| DELETE | `/me/flashcards/:id` | remove card from deck |

> ⚠️ Khai báo `/me/flashcards/due` TRƯỚC `/me/flashcards/:id`

---

## Prisma Schema

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

## Edge Cases

- **Duplicate flashcard:** check `@@unique([userId, dictionaryEntryId])`, catch Prisma P2002
- **SM-2 easeFactor:** validation min 1.3 trong domain service, không để xuống dưới
