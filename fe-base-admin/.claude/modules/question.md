# Module: modules/question

## Mục đích
Quản lý câu hỏi JLPT và ngữ pháp: CRUD + workflow duyệt bài (pending → approved/rejected). Hỗ trợ 3 loại câu hỏi (quiz, fill_in_blank, matching) và liên kết với article hoặc dictionary entry.

## Cấu trúc
```
modules/question/
├── components/
│   ├── QuestionPage.tsx        # Main page: Tabs "Tất cả" + "Chờ duyệt"
│   ├── QuestionModal.tsx       # Form động theo type (RHF + Zod discriminated union)
│   └── QuestionPreviewCard.tsx # Compact preview per type (dùng trong modal)
├── hooks/
│   └── useQuestion.ts          # useQuery + useMutation wrappers
├── services/
│   └── question.service.ts     # 7 API calls
├── types/
│   └── index.ts                # Question, QuestionData, DTOs
└── index.ts
```

## Routes
| Route | Component | Layout |
|---|---|---|
| `/questions` | `QuestionPage` | `MainLayout` (AdminGuard) |

## API Endpoints
| Method | Path | Hook/Function |
|---|---|---|
| GET | `/admin/questions` | `useQuestionList` (paginate, filter: status, referenceType, isPublic) |
| GET | `/admin/questions/:id` | `useQuestion` |
| POST | `/admin/questions` | `useCreateQuestion` |
| PATCH | `/admin/questions/:id` | `useUpdateQuestion` |
| DELETE | `/admin/questions/:id` | `useDeleteQuestion` |
| POST | `/admin/questions/:id/approve` | `useApproveQuestion` |
| POST | `/admin/questions/:id/reject` | `useRejectQuestion` |

## Query Keys
`QUERY_KEYS.QUESTION.LIST = ['question', 'list']`, `QUERY_KEYS.QUESTION.ENTRY = ['question', 'entry']`

## Types
```ts
QuestionType = 'quiz' | 'fill_in_blank' | 'matching'
QuestionStatus = 'pending' | 'approved' | 'rejected'
QuestionReferenceType = 'article' | 'dictionary' | 'none'

QuestionData {
  type: QuestionType
  prompt: string
  choices?: string[]     // quiz: answer options; matching: left items
  answer: unknown        // quiz: string; fill_in_blank: string; matching: string[] (right items)
  explanation?: string
  jlptLevel?: number
}

Question {
  id, questionData, referenceType, referenceId,
  status, isPublic, creatorId, staffAuthorId, verifiedBy, createdAt
}
```

## Gotchas
- **No separate /pending endpoint** (unlike dictionary): Tab "Chờ duyệt" dùng list endpoint với `filter.status=$eq:pending`
- **Matching encoding**: `choices[]` = left items, `answer[]` = right items (parallel arrays). FE form dùng `pairs: [{left, right}]` rồi map on submit
- **QuestionModal** dùng Zod discriminated union theo `questionData.type` — khi đổi type, sub-fields reset hoàn toàn (tránh stale data)
- **`answer` field**: type là `unknown` trong BE — quiz/fill_in_blank là string, matching là string[]
- Staff-created questions có status = `approved` ngay từ đầu (do `isStaff: true` trong use-case)
- Không có search (BE không có searchableColumns) — chỉ filter theo status, referenceType, isPublic
