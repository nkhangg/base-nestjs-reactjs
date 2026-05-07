# [FE] Admin Management Modules — Index
> **Ngày:** 07/05/2026

---

## Tổng quan

Kế hoạch implement 5 admin management modules mới cho `fe-base-admin`, tương ứng với các BE modules trong `planning/be-modules/`.

**Flashcard không có admin interface** — toàn bộ là user-facing endpoints (`/me/flashcards`).

---

## Thứ tự implement

| # | File | Module | Effort | Lý do ưu tiên |
|---|---|---|---|---|
| 1 | `plan-01-dictionary.md` | dictionary | Medium | Nền tảng, ít dependency |
| 2 | `plan-02-article.md` | article | High | Core learning content, cần editor |
| 3 | `plan-03-question.md` | question | Medium | Phụ thuộc article/dictionary đã có |
| 4 | `plan-04-progress.md` | progress | Low-Medium | Read-only, nhanh |
| 5 | `plan-05-organization.md` | organization | Medium | B2B Phase 2, để sau |

---

## Shared changes — làm một lần trước khi implement từng module

1. Thêm route constants vào `fe-base-admin/src/config/routes.ts`:
   - `DICTIONARY: '/dictionary'`
   - `ARTICLES: '/articles'`, `ARTICLES_NEW: '/articles/new'`, `ARTICLES_EDIT: '/articles/:id/edit'`
   - `QUESTIONS: '/questions'`
   - `PROGRESS: '/progress'`
   - `ORGANIZATIONS: '/organizations'`

2. Thêm query key groups vào `fe-base-admin/src/shared/constants/index.ts`:
   - `DICTIONARY`, `ARTICLE`, `QUESTION`, `PROGRESS`, `ORGANIZATION`

3. Thêm 5 sidebar entries vào MainLayout navigation (group "Nội dung học"):
   - Từ điển, Bài đọc, Câu hỏi, Tiến độ, Tổ chức

---

## Commands

```bash
/fe-add-feature dictionary    Trang quản lý từ điển — CRUD + duyệt bài
/fe-add-feature article       Trang quản lý bài đọc — CRUD + publish + categories + tags + duyệt
/fe-add-feature question      Trang quản lý câu hỏi — CRUD + moderation
/fe-add-feature progress      Trang admin xem activity log và leaderboard XP
/fe-add-feature organization  Trang admin quản lý organizations và classrooms
```
