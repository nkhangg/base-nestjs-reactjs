# Module: modules/question

## Mục đích
Hệ thống câu hỏi đa dạng (quiz, fill_in_blank, matching) liên kết với article hoặc dictionary. Dùng cho ngữ pháp exercises và JLPT mock test. Có workflow moderation (pending→approved/rejected) và tính năng random test generation.

## Cấu trúc
```
modules/question/
├── domain/
│   ├── entities/
│   │   └── question.entity.ts       # { id, questionData (JSON), referenceType, referenceId, status, isPublic, creatorId, staffAuthorId, verifiedBy, createdAt }
│   ├── value-objects/
│   │   └── question-id.vo.ts
│   ├── repositories/
│   │   └── question.repository.ts   # QUESTION_REPOSITORY
│   └── events/
│       └── mock-test-submitted.event.ts   # payload: userId, questionCount, correctCount, xp
├── application/use-cases/
│   ├── create-question.use-case.ts
│   ├── update-question.use-case.ts
│   ├── delete-question.use-case.ts
│   ├── get-question.use-case.ts
│   ├── list-questions.use-case.ts
│   ├── moderate-question.use-case.ts      # pending→approved|rejected
│   ├── generate-mock-test.use-case.ts     # N random approved+public, filter by jlptLevel
│   └── submit-test-result.use-case.ts     # grade, calc XP (10/correct), emit event
├── infrastructure/
│   ├── mappers/
│   │   └── question.mapper.ts
│   └── repositories/
│       ├── prisma-question.repository.ts
│       └── in-memory-question.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── question-admin.controller.ts   # /admin/questions (AdminAuthGuard)
│   │   └── question-admin.feature.ts      # resource: 'question-management'
│   ├── public/
│   │   └── question-public.controller.ts  # /questions (@Public())
│   └── user/
│       └── question-user.controller.ts    # /me/mock-test (@Public(), uses req.user optionally)
└── question.module.ts   # imports EventsModule, seeds question-editor/question-viewer roles
```

## Question Status Flow
```
pending → approved (moderate approve)
pending → rejected (moderate reject)
```
- Staff tạo câu hỏi → tự động `approved`
- User tạo câu hỏi → `pending`, chờ moderate

## QuestionData Schema (JSON)
```ts
{
  type: 'quiz' | 'fill_in_blank' | 'matching',
  prompt: string,
  choices?: string[],   // dùng cho quiz
  answer: unknown,      // index (quiz) | string (fill_in_blank) | pairs (matching)
  explanation?: string,
  jlptLevel?: number,   // 1–5, dùng để filter mock test
}
```
- `answer` và `explanation` bị loại khỏi response khi generate mock test (chỉ trả khi submit)

## API Routes

### Admin (`/admin/questions`)
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/questions` | read |
| POST | `/admin/questions` | create |
| GET | `/admin/questions/:id` | read |
| PATCH | `/admin/questions/:id` | update |
| DELETE | `/admin/questions/:id` | delete |
| POST | `/admin/questions/:id/approve` | approve |
| POST | `/admin/questions/:id/reject` | approve |

### Public (`/questions`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/questions` | list approved+public (filter: referenceType, referenceId) |
| GET | `/questions/:id` | chi tiết câu hỏi (approved+public only) |

### User (`/me/mock-test`)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/me/mock-test/generate` | generate N random questions (params: count, jlptLevel) |
| POST | `/me/mock-test/submit` | submit answers → grade + XP |

## Seeded Roles
| Role | SubjectType | Permissions |
|---|---|---|
| question-editor | admin | question-management → read, create, update, delete, approve |
| question-viewer | admin | question-management → read |

## Domain Events Published
- `mock-test.submitted` — sau khi submit test (payload: userId, questionCount, correctCount, xp)

## Dependencies
- Import `EventsModule` (để publish `MockTestSubmittedEvent`)
- `questionData.jlptLevel` dùng Prisma JSON path filter trong `findApprovedPublic`
