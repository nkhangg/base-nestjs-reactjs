# Module: modules/article

## Mục đích
Quản lý bài đọc tiếng Nhật. Admin CRUD bài đọc với JLPT level, categories (màu sắc + icon), tags; workflow publish/unpublish và moderation (pending → approved → published, rejected). Editor full-screen dùng `@uiw/react-md-editor`.

## Cấu trúc
```
modules/article/
├── components/
│   ├── ArticlePage.tsx          # List page — 4 tabs: Tất cả / Chờ duyệt / Chủ đề / Tags
│   ├── ArticleEditorPage.tsx    # Full-screen markdown editor (create + edit)
│   ├── ArticleCategoryModal.tsx # Tạo/sửa category (name, slug, colorCode, iconUrl)
│   └── ArticleTagModal.tsx      # Tạo tag (name only)
├── hooks/
│   ├── useArticle.ts            # useArticleList, usePendingArticles, useArticle,
│   │                            # useCreateArticle, useUpdateArticle, useDeleteArticle,
│   │                            # usePublishArticle, useUnpublishArticle,
│   │                            # useApproveArticle, useRejectArticle
│   └── useArticleTaxonomy.ts    # useCategoryList, useCreateCategory, useUpdateCategory,
│                                # useDeleteCategory, useTagList, useCreateTag, useDeleteTag
├── services/
│   └── article.service.ts
├── types/
│   └── index.ts                 # Article, ArticleDetail, ArticleCategory, ArticleTag,
│                                # ArticleStatus, all DTOs
└── index.ts
```

## Routes
| Route | Component | Layout |
|---|---|---|
| `/articles` | `ArticlePage` | `MainLayout` (sidebar) |
| `/articles/new` | `ArticleEditorPage` | Full-screen (no sidebar) |
| `/articles/:id/edit` | `ArticleEditorPage` | Full-screen (no sidebar) |

Dùng `articleEditPath(id)` từ `@config/routes` để build edit URL.

## Article Status Flow
```
pending → approved → published
pending → rejected
published → approved  (unpublish)
```

## API Endpoints

### Articles
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/articles` | `useArticleList` (paginate, filter: status, level) |
| GET | `/admin/articles/pending` | `usePendingArticles` (paginate) |
| GET | `/admin/articles/:id` | `useArticle` (kèm contentRaw + contentAnnotated) |
| POST | `/admin/articles` | `useCreateArticle` |
| PATCH | `/admin/articles/:id` | `useUpdateArticle` |
| DELETE | `/admin/articles/:id` | `useDeleteArticle` |
| POST | `/admin/articles/:id/publish` | `usePublishArticle` |
| POST | `/admin/articles/:id/unpublish` | `useUnpublishArticle` |
| POST | `/admin/articles/:id/approve` | `useApproveArticle` |
| POST | `/admin/articles/:id/reject` | `useRejectArticle` |

### Categories
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/articles/categories` | `useCategoryList` (flat, no pagination) |
| POST | `/admin/articles/categories` | `useCreateCategory` |
| PATCH | `/admin/articles/categories/:id` | `useUpdateCategory` |
| DELETE | `/admin/articles/categories/:id` | `useDeleteCategory` |

### Tags
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/articles/tags` | `useTagList` (flat, no pagination) |
| POST | `/admin/articles/tags` | `useCreateTag` |
| DELETE | `/admin/articles/tags/:id` | `useDeleteTag` |

## Query Keys
`QUERY_KEYS.ARTICLE.LIST`, `QUERY_KEYS.ARTICLE.PENDING`, `QUERY_KEYS.ARTICLE.DETAIL`,
`QUERY_KEYS.ARTICLE.CATEGORIES`, `QUERY_KEYS.ARTICLE.TAGS`

## Key Differences vs Blog Module
- `contentRaw` field (not `content`), no `contentType` — always markdown
- `level: number | null` — JLPT level (1=N1 hardest … 5=N5 easiest)
- `categoryIds: string[]` many-to-many (not single `categoryId`)
- `tagIds: string[]` entity IDs (not string array like blog tags)
- 4-state status: `pending | approved | rejected | published`
- Approve/reject moderation actions in ArticlePage + ArticleEditorPage header
- Categories have `colorCode` + `iconUrl` fields
- Tags are entities with their own IDs

## JSON Mode (ArticleEditorPage)
Header có toggle **Markdown / JSON**:
- **Markdown** (default) — MDEditor như bình thường, edit `contentRaw`.
- **JSON** — `JsonEditorPane`: textarea dark-theme để xem/sửa `contentAnnotated`.
  - Toolbar: **Format** (pretty-print JSON), **Reset về null** (xóa tokenized data).
  - Inline validation: border đỏ + error message khi JSON parse fail.
  - Nút **JSON** trong header hiển thị badge `null` (màu vàng) khi `contentAnnotated === null`.
  - Khi save với JSON invalid → `toast.error` + auto-switch về JSON mode để user fix.
  - `contentAnnotatedJson` bị **loại khỏi draft localStorage** để tránh 5MB quota overflow.
  - Create mode: `contentAnnotated` là optional (BE hỗ trợ), gửi khi có giá trị.
  - Edit mode: empty → gửi `null` (xóa tokenized data).

## Gotchas
- `contentAnnotated` có thể null (chưa tokenize) → KHÔNG fetch trong list
- `slug` là **required** khi create — auto-generated từ title, allow manual override
- Categories/tags list endpoints trả `{ data: [...] }` (flat, không paginated)
- `ArticleEditorPage` auto-save draft vào localStorage (key: `article_draft_{id|new}`)
- Draft **không** lưu `contentAnnotatedJson` — field này nặng, tránh overflow quota
