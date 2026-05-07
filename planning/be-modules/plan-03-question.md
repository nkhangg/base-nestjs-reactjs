# [BE] FEATURE PLAN — MODULE 3: question (Câu hỏi / Bài tập linh hoạt)
> **Ngày:** 06/05/2026

---

## Mục đích

Hệ thống câu hỏi đa dạng (quiz, fill_in_blank, matching) liên kết với article hoặc dictionary. Dùng cho ngữ pháp exercises và JLPT mock test.

---

## Domain

Files:
- CREATE `be-base/src/modules/question/domain/entities/question.entity.ts`
  — id, questionData (JSON: type, prompt, choices, answer, explanation), referenceType (article|dictionary|none), referenceId, status, isPublic, creatorId, staffAuthorId, verifiedBy
- CREATE `be-base/src/modules/question/domain/repositories/question.repository.ts`
  — findById, listByReference(type, id), listByStatus, listForTest(jlptLevel, count, random)

---

## Application

Files:
- CREATE use-cases: create, update, delete, get, list, moderate
- CREATE `generate-mock-test.use-case.ts` — lấy N câu ngẫu nhiên theo jlptLevel từ approved questions
- CREATE `submit-test-result.use-case.ts` — grade, tính XP, emit activity event

---

## Infrastructure

Files:
- CREATE `prisma-question.repository.ts`, mapper, in-memory repo

---

## Presentation

**Admin** (`/admin/questions`) — CRUD + moderate

**Public** (`/questions`) — list by reference

**User** (`/me/mock-test`) — generate test, submit result

---

## Prisma Schema

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
