# Module: modules/blog

## Mục đích
Quản lý blog posts và categories. Có hai presentation layer: admin (CRUD + publish) và public (read-only). Publish/unpublish emit domain event.

## Cấu trúc
```
modules/blog/
├── domain/
│   ├── entities/
│   │   ├── blog-post.entity.ts     # { id, title, slug, content, status, categoryId, publishedAt }
│   │   └── blog-category.entity.ts
│   └── repositories/
│       ├── blog-post.repository.ts    # BLOG_POST_REPOSITORY
│       └── blog-category.repository.ts  # BLOG_CATEGORY_REPOSITORY
├── application/use-cases/
│   ├── create-blog-post.use-case.ts
│   ├── update-blog-post.use-case.ts
│   ├── delete-blog-post.use-case.ts
│   ├── get-blog-post.use-case.ts
│   ├── list-blog-posts.use-case.ts
│   ├── publish-blog-post.use-case.ts     # emit 'blog.post.published' event
│   ├── unpublish-blog-post.use-case.ts
│   ├── create-blog-category.use-case.ts
│   ├── update-blog-category.use-case.ts
│   ├── delete-blog-category.use-case.ts
│   └── list-blog-categories.use-case.ts
├── infrastructure/repositories/
│   ├── prisma-blog-post.repository.ts
│   └── prisma-blog-category.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── blog-admin.controller.ts     # /admin/blog (AdminAuthGuard)
│   │   └── blog-admin.feature.ts
│   └── public/
│       └── blog-public.controller.ts    # /blog (public, @Public())
└── blog.module.ts    # imports EventsModule, seeds BLOG_ROLES
```

## API Routes

### Admin (`/admin/blog`)
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/blog/posts` | read |
| POST | `/admin/blog/posts` | create |
| GET | `/admin/blog/posts/:id` | read |
| PATCH | `/admin/blog/posts/:id` | update |
| DELETE | `/admin/blog/posts/:id` | delete |
| POST | `/admin/blog/posts/:id/publish` | publish |
| POST | `/admin/blog/posts/:id/unpublish` | publish |
| GET | `/admin/blog/categories` | read |
| POST | `/admin/blog/categories` | create |
| PATCH | `/admin/blog/categories/:id` | update |
| DELETE | `/admin/blog/categories/:id` | delete |

### Public (`/blog`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/blog/posts` | List published posts (paginate) |
| GET | `/blog/posts/:slug` | Get post by slug |
| GET | `/blog/categories` | List categories |

## Seeded Roles

| Role | SubjectType | Permissions |
|---|---|---|
| blog-editor | admin | blog-management → read, create, update, delete, publish |
| blog-viewer | admin | blog-management → read |

## Domain Events Published
- `blog.post.published` — sau khi publish post thành công (handler trong IntegrationModule)

## Dependencies
- Import `EventsModule` (để publish domain events)
