# [FE] FEATURE PLAN — MODULE 3: question (Quản lý câu hỏi)
> **Ngày:** 07/05/2026

---

## Tóm tắt
Admin CRUD câu hỏi đa dạng (quiz, fill_in_blank, matching) dùng cho JLPT mock test
và ngữ pháp exercises. Mỗi câu hỏi có thể liên kết với article hoặc dictionary entry.
Workflow: submit → pending → approve/reject.

---

## Layer breakdown

### Types
Files:
- CREATE `fe-base-admin/src/modules/question/types/index.ts`
  — `QuestionData: { type: 'quiz'|'fill_in_blank'|'matching', prompt: string, choices?: string[], answer: string|string[], explanation?: string }`
  — `Question { id, questionData: QuestionData, referenceType?: 'article'|'dictionary'|'none', referenceId?: string, status: 'pending'|'approved'|'rejected', isPublic, creatorId?, staffAuthorId?, verifiedBy?, createdAt }`
  — `CreateQuestionDto`, `UpdateQuestionDto`

### Service
Files:
- CREATE `fe-base-admin/src/modules/question/services/question.service.ts`
  — `list(params)` → GET `/admin/questions` (paginate, filter: status, referenceType)
  — `getPending()` → GET `/admin/questions/pending`
  — `getById(id)` → GET `/admin/questions/:id`
  — `create(dto)` → POST `/admin/questions`
  — `update(id, dto)` → PATCH `/admin/questions/:id`
  — `delete(id)` → DELETE `/admin/questions/:id`
  — `approve(id)` → POST `/admin/questions/:id/approve`
  — `reject(id)` → POST `/admin/questions/:id/reject`

### Hooks
Files:
- CREATE `fe-base-admin/src/modules/question/hooks/useQuestion.ts`
  — `useQuestionList(params)`, `usePendingQuestions()`, `useQuestion(id)`
  — `useCreateQuestion`, `useUpdateQuestion`, `useDeleteQuestion`
  — `useApproveQuestion`, `useRejectQuestion`

### Components
Files:
- CREATE `fe-base-admin/src/modules/question/components/QuestionPage.tsx`
  — Tabs: "Tất cả" + "Chờ duyệt"
  — DataTable: columns = type, prompt preview (truncated), referenceType, status, createdAt
  — Filter: status (select), referenceType (select), type (select)
  — Actions: Tạo, Sửa (mở modal), Xóa, Approve/Reject
- CREATE `fe-base-admin/src/modules/question/components/QuestionModal.tsx`
  — Form động: khi chọn type → hiển thị đúng sub-form
  — quiz: prompt + choices (dynamic field array) + answer (select từ choices) + explanation
  — fill_in_blank: prompt (với placeholder ___) + answer text + explanation
  — matching: pairs của left/right items (useFieldArray, min 2 cặp)
  — referenceType: select (article/dictionary/none); referenceId ẩn khi type = 'none'
  — Validation Zod discriminated union theo từng type
- CREATE `fe-base-admin/src/modules/question/components/QuestionPreviewCard.tsx`
  — Preview render câu hỏi dựa theo `questionData.type` (dùng trong modal + list)

### Router & Navigation
Files:
- MODIFY `fe-base-admin/src/app/router.tsx`
  — Thêm `QuestionPage` route `/questions` trong AdminGuard + MainLayout
- MODIFY `fe-base-admin/src/config/routes.ts`
  — `QUESTIONS: '/questions'`

### i18n
```
vi.json:
  question.title: "Câu hỏi"
  question.type.quiz: "Trắc nghiệm"
  question.type.fill_in_blank: "Điền vào chỗ trống"
  question.type.matching: "Ghép đôi"
  question.referenceType: "Liên kết với"
  question.approve: "Phê duyệt"
  question.reject: "Từ chối"
  question.choices: "Các lựa chọn"
  question.answer: "Đáp án"
  question.explanation: "Giải thích"
  question.prompt: "Câu hỏi"

en.json:
  question.title: "Questions"
  question.type.quiz: "Multiple choice"
  question.type.fill_in_blank: "Fill in the blank"
  question.type.matching: "Matching"
  question.referenceType: "Reference"
  question.approve: "Approve"
  question.reject: "Reject"
  question.choices: "Choices"
  question.answer: "Answer"
  question.explanation: "Explanation"
  question.prompt: "Question"
```

---

## UX notes
- Loading: Skeleton rows trong DataTable, spinner trong modal
- Error: `toast.error()` + giữ nguyên form
- Empty: `Empty` component với nút "Tạo câu hỏi đầu tiên"
- `QuestionModal`: chuyển động khi đổi type (type select ở trên cùng) — reset choices/answer khi type thay đổi để tránh stale data
- `QuestionPreviewCard`: nhỏ gọn, chỉ dùng trong modal sidebar
- Confirmation dialog: Yes khi Delete

---

## Edge cases & risks
- `questionData` là JSON với shape khác nhau theo type → Zod discriminated union
- `referenceId` phụ thuộc `referenceType`: nếu type = `'none'` thì ẩn trường `referenceId`
- matching type: cần dynamic pair input (ít nhất 2 cặp), mảng complex hơn quiz
- `choices` và `answer` phải đồng bộ: answer phải là một trong choices (cho quiz type)
- Status filter: admin thường chỉ cần xem approved và pending; rejected có thể ít

---

## Effort estimate
| Layer | Effort |
|---|---|
| Types | Medium |
| Service | Low |
| Hooks | Medium |
| Components | High |
| Router | Low |
| **Total** | **Medium-High** |

---

## Checklist khi implement
- [ ] `QuestionModal` dùng Zod discriminated union theo `questionData.type`
- [ ] Dynamic field array dùng `useFieldArray` từ React Hook Form (choices, pairs)
- [ ] Khi type thay đổi, reset `questionData` sub-fields (không giữ lại choices cũ)
- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each API call
- [ ] `useQuery` hooks có correct `queryKey` từ `QUERY_KEYS.QUESTION.*`
- [ ] `useMutation` invalidate relevant queries on success
- [ ] Toast notifications on success and error
- [ ] Delete có `ConfirmDialog`
- [ ] Thêm `QUERY_KEYS.QUESTION` vào `src/shared/constants/index.ts`
- [ ] `fe-base-admin/.claude/modules/question.md` tạo sau khi implement
