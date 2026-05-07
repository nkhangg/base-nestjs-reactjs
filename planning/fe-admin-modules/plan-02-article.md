# [FE] FEATURE PLAN — MODULE 2: article (Quản lý bài đọc)
> **Ngày:** 07/05/2026

---

## Tóm tắt
Tương tự blog module nhưng dành cho nội dung học thuật. Admin CRUD bài đọc với
JLPT level, categories (màu sắc + icon), tags; workflow publish/unpublish và
moderation (pending → approved/rejected). Editor full-screen riêng cho nội dung bài đọc.

---

## Layer breakdown

### Types
Files:
- CREATE `fe-base-admin/src/modules/article/types/index.ts`
  — `Article { id, title, slug, contentRaw, level?, status, authorId?, staffAuthorId?, verifiedBy?, categories: ArticleCategory[], tags: ArticleTag[], createdAt }`
  — `ArticleCategory { id, name, slug, colorCode?, iconUrl? }`
  — `ArticleTag { id, name }`
  — `ArticleStatus: 'pending' | 'approved' | 'rejected'`
  — `CreateArticleDto`, `UpdateArticleDto`, `CreateCategoryDto`, `CreateTagDto`

### Service
Files:
- CREATE `fe-base-admin/src/modules/article/services/article.service.ts`
  — `list(params)` → GET `/admin/articles` (paginate, filter: status, level, category, tag)
  — `getPending()` → GET `/admin/articles/pending`
  — `getById(id)` → GET `/admin/articles/:id`
  — `create(dto)` → POST `/admin/articles`
  — `update(id, dto)` → PATCH `/admin/articles/:id`
  — `delete(id)` → DELETE `/admin/articles/:id`
  — `publish(id)` → POST `/admin/articles/:id/publish`
  — `unpublish(id)` → POST `/admin/articles/:id/unpublish`
  — `approve(id)` → POST `/admin/articles/:id/approve`
  — `reject(id)` → POST `/admin/articles/:id/reject`
  — `listCategories()` → GET `/admin/articles/categories`
  — `createCategory(dto)` → POST `/admin/articles/categories`
  — `updateCategory(id, dto)` → PATCH `/admin/articles/categories/:id`
  — `deleteCategory(id)` → DELETE `/admin/articles/categories/:id`
  — `listTags()` → GET `/admin/articles/tags`
  — `createTag(dto)` → POST `/admin/articles/tags`
  — `deleteTag(id)` → DELETE `/admin/articles/tags/:id`

### Hooks
Files:
- CREATE `fe-base-admin/src/modules/article/hooks/useArticle.ts`
  — `useArticleList(params)`, `usePendingArticles()`, `useArticle(id)`
  — `useCreateArticle`, `useUpdateArticle`, `useDeleteArticle`
  — `usePublishArticle`, `useUnpublishArticle`, `useApproveArticle`, `useRejectArticle`
- CREATE `fe-base-admin/src/modules/article/hooks/useArticleTaxonomy.ts`
  — `useCategoryList()`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
  — `useTagList()`, `useCreateTag`, `useDeleteTag`

### Components
Files:
- CREATE `fe-base-admin/src/modules/article/components/ArticlePage.tsx`
  — Tabs: "Tất cả" (DataTable) + "Chờ duyệt"
  — Filter: status, jlptLevel, category (multi-select), tags
  — Actions: Tạo mới (→ `/articles/new`), Edit (→ `/articles/:id/edit`), Delete, Publish/Unpublish, Approve/Reject
  — Sub-section cho Categories + Tags management (collapsible panel hoặc dialog)
- CREATE `fe-base-admin/src/modules/article/components/ArticleEditorPage.tsx`
  — Full-screen editor (pattern giống `BlogPostEditorPage`)
  — Fields: title, slug (auto-gen), level (N1–N5), categories (multi-select), tags (tag input), contentRaw (Markdown `@uiw/react-md-editor`)
  — Sidebar panel: metadata fields, status badge, Save/Publish buttons
- CREATE `fe-base-admin/src/modules/article/components/ArticleCategoryModal.tsx`
  — Form: name, slug (auto), colorCode (color picker), iconUrl (MediaPicker từ `@modules/media`)
- CREATE `fe-base-admin/src/modules/article/components/ArticleTagModal.tsx`
  — Form: name only

### Router & Navigation
Files:
- MODIFY `fe-base-admin/src/app/router.tsx`
  — Thêm `ArticlePage` (MainLayout) + `ArticleEditorPage` (full-screen, no sidebar)
  — Routes: `/articles`, `/articles/new`, `/articles/:id/edit`
- MODIFY `fe-base-admin/src/config/routes.ts`
  — `ARTICLES: '/articles'`
  — `ARTICLES_NEW: '/articles/new'`
  — `ARTICLES_EDIT: '/articles/:id/edit'`
  — `articleEditPath(id: string)` helper function

### i18n
```
vi.json:
  article.title: "Bài đọc"
  article.pending: "Chờ duyệt"
  article.level: "Cấp độ JLPT"
  article.categories: "Chủ đề"
  article.tags: "Tags"
  article.publish: "Xuất bản"
  article.unpublish: "Gỡ xuất bản"
  article.approve: "Phê duyệt"
  article.reject: "Từ chối"
  article.contentRaw: "Nội dung"
  article.slug: "Đường dẫn (slug)"

en.json:
  article.title: "Articles"
  article.pending: "Pending"
  article.level: "JLPT Level"
  article.categories: "Categories"
  article.tags: "Tags"
  article.publish: "Publish"
  article.unpublish: "Unpublish"
  article.approve: "Approve"
  article.reject: "Reject"
  article.contentRaw: "Content"
  article.slug: "Slug"
```

---

## UX notes
- Loading: Skeleton trên ArticlePage, spinner khi save trong editor
- Error: `toast.error()` + giữ nguyên form để user retry
- Empty: `Empty` component với nút "Viết bài đầu tiên"
- `ArticleEditorPage`: auto-save draft vào localStorage (key: `article_draft_{id|new}`)
- Slug: auto-generate từ title khi user chưa nhập, allow manual override
- `contentAnnotated` (tokenized JSON) rất nặng → KHÔNG fetch trong list, chỉ trong editor
- Confirmation dialog: Yes khi Delete và Unpublish (destructive/visible)

---

## Edge cases & risks
- `contentAnnotated` có thể null (chưa được tokenize) → hiển thị badge "Chưa tokenize"
- Slug unique constraint → handle 409 Conflict từ API, hiển thị lỗi ở slug field
- Many-to-many categories/tags: gửi arrays of IDs trong DTO
- `ArticleEditorPage` dùng `useParams()` để phân biệt create vs edit (tương tự `BlogPostEditorPage`)
- `MediaPicker` trong `ArticleCategoryModal` cần `@modules/media` — import qua public API

---

## Effort estimate
| Layer | Effort |
|---|---|
| Types | Low |
| Service | Medium |
| Hooks | Medium |
| Components | High |
| Router | Low |
| **Total** | **High** |

---

## Checklist khi implement
- [ ] `ArticleEditorPage` dùng lazy loading, full-screen (không có MainLayout sidebar)
- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each API call
- [ ] `useQuery` hooks có correct `queryKey` từ `QUERY_KEYS.ARTICLE.*`
- [ ] `useMutation` invalidate relevant queries on success
- [ ] Toast notifications on success and error
- [ ] All user-facing strings dùng `useTranslation()`
- [ ] Forms dùng React Hook Form + Zod validation
- [ ] Delete và Unpublish có `ConfirmDialog`
- [ ] Slug auto-generate từ title nhưng allow override
- [ ] `contentAnnotated` KHÔNG được fetch trong list endpoint
- [ ] Thêm `QUERY_KEYS.ARTICLE` vào `src/shared/constants/index.ts`
- [ ] `fe-base-admin/.claude/modules/article.md` tạo sau khi implement
