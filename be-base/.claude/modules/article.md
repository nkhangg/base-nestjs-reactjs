# Module: modules/article

## Mục đích
Kho bài đọc tiếng Nhật với phân loại (categories, tags), tokenization để click-to-lookup (contentAnnotated), furigana toggle. Có workflow moderation (pending→approved) và publish (approved→published). Khác với blog (marketing), article phục vụ học viên trực tiếp.

## Cấu trúc
```
modules/article/
├── domain/
│   ├── entities/
│   │   ├── article.entity.ts           # { id, title, slug, contentRaw, contentAnnotated, level, status, authorId, staffAuthorId, verifiedBy, categoryIds[], tagIds[] }
│   │   ├── article-category.entity.ts  # { id, name, slug, colorCode, iconUrl }
│   │   └── article-tag.entity.ts       # { id, name }
│   ├── repositories/
│   │   ├── article.repository.ts       # ARTICLE_REPOSITORY
│   │   ├── article-category.repository.ts  # ARTICLE_CATEGORY_REPOSITORY
│   │   └── article-tag.repository.ts   # ARTICLE_TAG_REPOSITORY
│   ├── value-objects/
│   │   ├── article-id.vo.ts
│   │   ├── article-category-id.vo.ts
│   │   └── article-tag-id.vo.ts
│   └── events/
│       └── article-published.event.ts
├── application/use-cases/
│   ├── create-article.use-case.ts
│   ├── update-article.use-case.ts
│   ├── delete-article.use-case.ts
│   ├── get-article.use-case.ts
│   ├── get-article-by-slug.use-case.ts
│   ├── list-articles.use-case.ts
│   ├── publish-article.use-case.ts     # approved → published, emit article.published event
│   ├── unpublish-article.use-case.ts   # published → approved
│   ├── moderate-article.use-case.ts    # pending → approved | rejected
│   ├── list-pending-articles.use-case.ts
│   ├── create-article-category.use-case.ts
│   ├── update-article-category.use-case.ts
│   ├── delete-article-category.use-case.ts
│   ├── list-article-categories.use-case.ts
│   ├── create-article-tag.use-case.ts
│   ├── delete-article-tag.use-case.ts
│   └── list-article-tags.use-case.ts
├── infrastructure/
│   ├── mappers/
│   │   ├── article.mapper.ts
│   │   ├── article-category.mapper.ts
│   │   └── article-tag.mapper.ts
│   └── repositories/
│       ├── prisma-article.repository.ts         # $transaction cho junction tables
│       ├── prisma-article-category.repository.ts
│       ├── prisma-article-tag.repository.ts
│       ├── in-memory-article.repository.ts
│       ├── in-memory-article-category.repository.ts
│       └── in-memory-article-tag.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── article-admin.controller.ts   # /admin/articles (AdminAuthGuard)
│   │   └── article-admin.feature.ts      # resource: 'article-management'
│   └── public/
│       └── article-public.controller.ts  # /articles (@Public())
└── article.module.ts   # imports EventsModule, seeds article-editor/article-viewer roles
```

## Article Status Flow
```
pending → approved (moderate approve)
pending → rejected (moderate reject)
approved → published (publish)
published → approved (unpublish)
```
- `contentAnnotated` (JSONB) chỉ trả về trong GET single article (không có trong list)

## API Routes

### Admin (`/admin/articles`)
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/articles/pending` | read |
| GET | `/admin/articles/categories` | read |
| POST | `/admin/articles/categories` | create |
| GET | `/admin/articles/tags` | read |
| POST | `/admin/articles/tags` | create |
| GET | `/admin/articles` | read |
| POST | `/admin/articles` | create |
| PATCH | `/admin/articles/categories/:id` | update |
| DELETE | `/admin/articles/categories/:id` | delete |
| DELETE | `/admin/articles/tags/:id` | delete |
| GET | `/admin/articles/:id` | read |
| PATCH | `/admin/articles/:id` | update |
| DELETE | `/admin/articles/:id` | delete |
| POST | `/admin/articles/:id/publish` | publish |
| POST | `/admin/articles/:id/unpublish` | publish |
| POST | `/admin/articles/:id/approve` | approve |
| POST | `/admin/articles/:id/reject` | approve |

### Public (`/articles`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/articles/categories` | list categories |
| GET | `/articles` | list published (filter: level, categoryId, tagId) |
| GET | `/articles/:slug` | get by slug + contentAnnotated |

## Seeded Roles
| Role | SubjectType | Permissions |
|---|---|---|
| article-editor | admin | article-management → read, create, update, delete, publish, approve |
| article-viewer | admin | article-management → read |

## Domain Events Published
- `article.published` — sau khi publish article thành công (payload: articleId, title, slug, publishedBy)

## Dependencies
- Import `EventsModule` (để publish domain events)
- Many-to-many với categories/tags qua junction tables (ArticleCategoryMap, ArticleTagMap) — cascade delete
