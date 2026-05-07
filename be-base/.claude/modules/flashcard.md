# Module: modules/flashcard

## Mục đích
Hệ thống thẻ học Spaced Repetition (thuật toán SM-2) per-user. User tạo flashcard từ dictionary entry, hệ thống lên lịch review tự động.

## Cấu trúc
```
modules/flashcard/
├── domain/
│   ├── entities/flashcard.entity.ts      # { id, userId, dictionaryEntryId, interval, easeFactor, nextReview, status, lastReviewedAt }
│   ├── repositories/flashcard.repository.ts  # FLASHCARD_REPOSITORY symbol
│   ├── value-objects/flashcard-id.vo.ts
│   └── services/srs.service.ts           # calculateNextReview(interval, easeFactor, rating 1-5) → SM-2
├── application/use-cases/
│   ├── add-flashcard.use-case.ts         # add word to deck (prevent duplicate)
│   ├── get-review-session.use-case.ts    # lấy ≤N cards due today
│   ├── submit-review.use-case.ts         # apply SM-2, update card
│   ├── list-flashcards.use-case.ts       # list by userId + optional status filter
│   └── delete-flashcard.use-case.ts
├── infrastructure/
│   ├── mappers/flashcard.mapper.ts
│   └── repositories/
│       ├── prisma-flashcard.repository.ts
│       └── in-memory-flashcard.repository.ts
├── presentation/
│   └── flashcard.controller.ts           # /me/flashcards (AuthGuard)
└── flashcard.module.ts
```

## API Routes

### User (`/me/flashcards`) — AuthGuard (JWT cookie)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/me/flashcards` | Add dictionary entry to deck |
| GET | `/me/flashcards` | List all my cards (filter: status) |
| GET | `/me/flashcards/due` | Get today's review session (due cards) |
| POST | `/me/flashcards/:id/review` | Submit SM-2 rating (1–5) |
| DELETE | `/me/flashcards/:id` | Remove card from deck |

> ⚠️ `/me/flashcards/due` khai báo TRƯỚC `/me/flashcards/:id` trong controller

## Domain Model
- `Flashcard.create({ userId, dictionaryEntryId })` — interval=0, easeFactor=2.5, status=new, nextReview=now
- `card.applyReview(interval, easeFactor)` — update SRS fields, recalculate nextReview, update status
- Status transitions: new → learning (interval>0) → mastered (interval>=21)

## SRS Algorithm (SM-2)
- `SrsService.calculateNextReview(currentInterval, currentEaseFactor, rating)` → `{ interval, easeFactor }`
- rating < 3 → reset interval to 0 (re-learn)
- interval=0 → next=1 day; interval=1 → next=6 days; else → round(interval × easeFactor)
- easeFactor min = 1.3

## Dependencies
- Prisma model: `Flashcard` (@@map "flashcards"), relation → `DictionaryEntry`
- No admin panel, no domain events
