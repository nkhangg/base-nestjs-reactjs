# [BE] FEATURE PLAN — TỔNG THỂ (Index)
> **Module:** Hệ thống học tiếng Nhật — Nihongo Learning
> **Ngày:** 06/05/2026

---

## Thứ tự implement theo độ ưu tiên

| # | File | Module | Lý do ưu tiên |
|---|---|---|---|
| 0 | `plan-00-user-expansion.md` | User Model Expansion | Tiên quyết cho progress |
| 1 | `plan-01-dictionary.md` | dictionary | Nền tảng cho flashcard và article lookup |
| 2 | `plan-02-article.md` | article | Core learning — Đọc hiểu Phase 1/2 |
| 3 | `plan-03-question.md` | question | Mock test JLPT + ngữ pháp exercises |
| 4 | `plan-04-flashcard.md` | flashcard | Core learning — đã có design Phase 1 |
| 5 | `plan-05-progress.md` | progress | Dashboard, XP, streak, heatmap |
| 6 | `plan-06-organization.md` | organization | B2B Phase 2 — sau khi core stable |

---

## Thứ tự migrations

```
add_user_gamification_fields
→ create_dictionary_entries
→ create_articles_and_taxonomy
→ create_questions
→ create_flashcards
→ create_progress_tables
→ create_organizations_and_classrooms
```

---

## Effort Estimate

| Module | Effort |
|---|---|
| User expansion | Low |
| dictionary | Medium |
| article | High |
| question | Medium |
| flashcard | Medium |
| progress | High |
| organization | Medium |
| **TOTAL** | **~6–8 tuần** |

---

## Checklist chung khi implement

- [ ] Chạy migrations theo đúng thứ tự trên
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

## Commands

```bash
/be-add-feature dictionary     <feature description>
/be-add-feature article        <feature description>
/be-add-feature question       <feature description>
/be-add-feature flashcard      <feature description>
/be-add-feature progress       <feature description>
/be-add-feature organization   <feature description>
```
