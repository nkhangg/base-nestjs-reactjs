# Kế hoạch: Blog Module

## Context

Cần xây dựng module Blog hoàn chỉnh theo cùng kiến trúc Clean Architecture + DDD đang dùng trong dự án.
Module phục vụ quản lý nội dung blog (bài viết, danh mục) từ admin panel và expose public API cho FE site.

---

## Đề xuất chức năng

### 1. Bài viết (Blog Posts)
| Chức năng | Mô tả |
|-----------|-------|
| Tạo bài viết | Title, slug (auto-gen từ title), content, excerpt, ảnh bìa (MediaFile), danh mục, tags |
| Chỉnh sửa | Cập nhật toàn bộ nội dung bài viết |
| Publish workflow | `draft` → `published` → `archived`; có thể Unpublish (→ `draft`) |
| Xóa bài viết | Soft-delete (isDeleted flag) hoặc hard-delete |
| Danh sách | Search (title, content), filter (status, categoryId), sort (title, createdAt, publishedAt) |
| SEO fields | metaTitle, metaDesc (optional, dùng khi public site cần SEO) |

### 2. Danh mục (Blog Categories)
| Chức năng | Mô tả |
|-----------|-------|
| CRUD | Tên, slug, mô tả, ảnh bìa |
| Ràng buộc | Xóa category không xóa bài viết (SetNull trên categoryId) |
| Danh sách | Sort, search theo tên |

### 3. Tags
String array trên bài viết — không tách entity riêng, đủ linh hoạt, không cần CRUD route.

### 4. Domain Events
| Event | Trigger | Handler trong IntegrationModule |
|-------|---------|----------------------------------|
| `blog.post_published` | Khi publish bài viết | Gửi notification đến tất cả admin |
| `blog.post_created` | Khi tạo bài viết mới | (log / future use) |

### 5. Public API *(không auth)*
- `GET /blog-posts` — danh sách bài viết đã published (filter, paginate)
- `GET /blog-posts/:slug` — chi tiết bài viết theo slug

---

## Kiến trúc tổng quan

```
AdminAuthGuard           PermissionGuard (hoặc Public)
    ↓                            ↓
/admin/blog-posts         /blog-posts (public)
    ↓                            ↓
Use-cases (application layer — inject repository interfaces)
    ↓
IPostRepository / ICategoryRepository
    ↓
PrismaPostRepository / PrismaCategoryRepository
```

---

## Phase 1 — Prisma Schema

File: `be-base/prisma/schema.prisma`

```prisma
model BlogPost {
  id          String        @id
  slug        String        @unique
  title       String
  content     String        @db.Text
  excerpt     String?
  status      String        @default("draft")   // draft | published | archived
  coverFileId String?
  categoryId  String?
  category    BlogCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags        String[]
  authorId    String?       // adminId
  metaTitle   String?
  metaDesc    String?
  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("blog_posts")
}

model BlogCategory {
  id          String     @id
  name        String     @unique
  slug        String     @unique
  description String?
  coverFileId String?
  posts       BlogPost[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("blog_categories")
}
```

Chạy: `npx prisma migrate dev --name add-blog-module`

---

## Phase 2 — Domain Layer

### Value Objects
```
modules/blog/domain/value-objects/
├── blog-post-id.vo.ts        // wrap string UUID
└── blog-category-id.vo.ts
```

Pattern từ `config/domain/value-objects/config-id.vo.ts`.

### Entities

**`blog-post.entity.ts`**
```typescript
export type BlogPostStatus = 'draft' | 'published' | 'archived';

export class BlogPost extends BaseEntity<BlogPostId> {
  static create(params: CreateParams): BlogPost { ... }
  static reconstitute(id: string, props: BlogPostProps): BlogPost { ... }

  publish(): void {
    this.props.status = 'published';
    this.props.publishedAt = new Date();
  }
  unpublish(): void { this.props.status = 'draft'; }
  archive(): void { this.props.status = 'archived'; }
  update(params: UpdateParams): void { ... }

  get slug() / get title() / get status() / get publishedAt() / ...
}
```

**`blog-category.entity.ts`** — tương tự, đơn giản hơn (name, slug, description, coverFileId).

### Repository Interfaces

**`blog-post.repository.ts`**
```typescript
export const BLOG_POST_REPOSITORY = Symbol('BLOG_POST_REPOSITORY');

export interface FindAllPostsOptions {
  page: number; pageSize: number;
  status?: BlogPostStatus;
  categoryId?: string;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'publishedAt';
  sortDir?: 'asc' | 'desc';
  publishedOnly?: boolean;   // dùng cho public API
}

export interface IBlogPostRepository {
  findById(id: string): Promise<BlogPost | null>;
  findBySlug(slug: string): Promise<BlogPost | null>;
  findAll(opts: FindAllPostsOptions): Promise<{ data: BlogPost[]; total: number }>;
  save(post: BlogPost): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**`blog-category.repository.ts`** — tương tự, `findAll` + `findById` + `findBySlug` + `save` + `delete`.

### Domain Events

```
modules/blog/domain/events/
├── blog-post-created.event.ts     // eventName: 'blog.post_created'
└── blog-post-published.event.ts   // eventName: 'blog.post_published'
```

Pattern từ `user/domain/events/user-created.event.ts`:
```typescript
export class BlogPostPublishedEvent extends DomainEvent {
  readonly eventName = 'blog.post_published';
  constructor(
    public readonly postId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly authorId: string | null,
  ) { super(); }
}
```

---

## Phase 3 — Application Layer (Use-Cases)

### Post Use-Cases
| File | Input | Output |
|------|-------|--------|
| `create-blog-post.use-case.ts` | title, slug?, content, excerpt?, coverFileId?, categoryId?, tags?, authorId | `Result<{ postId }, string>` — error: SLUG_EXISTS |
| `update-blog-post.use-case.ts` | id, partial update fields | `Result<void, string>` — error: NOT_FOUND, SLUG_EXISTS |
| `delete-blog-post.use-case.ts` | id | `Result<void, string>` |
| `get-blog-post.use-case.ts` | id | `Result<BlogPost, string>` |
| `list-blog-posts.use-case.ts` | FindAllPostsOptions | `{ data, total }` (không Result) |
| `publish-blog-post.use-case.ts` | id | `Result<void, string>` — emit `BlogPostPublishedEvent` |
| `unpublish-blog-post.use-case.ts` | id | `Result<void, string>` |

### Category Use-Cases
| File | Input | Output |
|------|-------|--------|
| `create-blog-category.use-case.ts` | name, slug?, description?, coverFileId? | `Result<{ categoryId }, string>` |
| `update-blog-category.use-case.ts` | id, partial fields | `Result<void, string>` |
| `delete-blog-category.use-case.ts` | id | `Result<void, string>` |
| `list-blog-categories.use-case.ts` | page, pageSize, search? | `{ data, total }` |

**Inject `DOMAIN_EVENT_BUS`** vào `PublishBlogPostUseCase`:
```typescript
constructor(
  @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
  @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
) {}

async execute(id: string): Promise<Result<void, string>> {
  const post = await this.postRepo.findById(id);
  if (!post) return { ok: false, error: 'NOT_FOUND' };
  post.publish();
  await this.postRepo.save(post);
  this.eventBus.publish(new BlogPostPublishedEvent(post.id.value, post.title, post.slug, post.authorId));
  return { ok: true, value: undefined };
}
```

---

## Phase 4 — Infrastructure Layer

### Mappers
```
modules/blog/infrastructure/mappers/
├── blog-post.mapper.ts        // toDomain(prismaRow): BlogPost; toRow không cần (dùng upsert)
└── blog-category.mapper.ts
```

### Prisma Repositories

**`prisma-blog-post.repository.ts`**
```typescript
async findAll(opts: FindAllPostsOptions): Promise<{ data: BlogPost[]; total: number }> {
  const where: Prisma.BlogPostWhereInput = {};
  if (opts.status) where.status = opts.status;
  if (opts.publishedOnly) where.status = 'published';
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.search) where.OR = [
    { title: { contains: opts.search, mode: 'insensitive' } },
    { content: { contains: opts.search, mode: 'insensitive' } },
  ];
  const sortKey = opts.sortBy ?? 'createdAt';
  const sortDir = opts.sortDir ?? 'desc';
  const skip = (opts.page - 1) * opts.pageSize;
  const [rows, total] = await Promise.all([
    this.prisma.blogPost.findMany({ where, skip, take: opts.pageSize, orderBy: { [sortKey]: sortDir } }),
    this.prisma.blogPost.count({ where }),
  ]);
  return { data: rows.map(BlogPostMapper.toDomain), total };
}

async save(post: BlogPost): Promise<void> {
  await this.prisma.blogPost.upsert({
    where: { id: post.id.value },
    create: { id, slug, title, content, excerpt, status, coverFileId, categoryId, tags, authorId, metaTitle, metaDesc, publishedAt, createdAt, updatedAt },
    update: { slug, title, content, excerpt, status, coverFileId, categoryId, tags, metaTitle, metaDesc, publishedAt, updatedAt },
  });
}
```

---

## Phase 5 — Presentation Layer

### Paginate Configs

```typescript
const POST_PAGINATE_CONFIG = {
  sortableColumns: ['title', 'createdAt', 'publishedAt'],
  searchableColumns: ['title', 'content', 'excerpt'],
  filterableColumns: {
    status:     [FilterOperator.EQ],
    categoryId: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

const CATEGORY_PAGINATE_CONFIG = {
  sortableColumns: ['name', 'createdAt'],
  searchableColumns: ['name', 'description'],
  defaultLimit: 50,
  maxLimit: 200,
};
```

### Admin Controller (`/admin/blog-posts` + `/admin/blog-categories`)

```
presentation/admin/
├── blog-admin.controller.ts     // @UseGuards(AdminAuthGuard)
└── blog-admin.feature.ts        // AdminFeature: resource='blog-management'
```

Routes:
| Method | Path | Permission |
|--------|------|-----------|
| GET | `/admin/blog-posts` | read |
| POST | `/admin/blog-posts` | create |
| GET | `/admin/blog-posts/:id` | read |
| PATCH | `/admin/blog-posts/:id` | update |
| DELETE | `/admin/blog-posts/:id` | delete |
| POST | `/admin/blog-posts/:id/publish` | publish |
| POST | `/admin/blog-posts/:id/unpublish` | update |
| GET | `/admin/blog-categories` | read |
| POST | `/admin/blog-categories` | create |
| PATCH | `/admin/blog-categories/:id` | update |
| DELETE | `/admin/blog-categories/:id` | delete |

**Route ordering**: `/admin/blog-posts/:id/publish` phải khai báo TRƯỚC `/:id` để không bị treated as ID param.
Thực tế controller NestJS dùng method decorator → không cần lo, nhưng nếu có route `@Get('stats')` thì đặt trước `@Get(':id')`.

### Public Controller (`/blog-posts`) — `@Public()`

```typescript
@Controller('blog-posts')
export class BlogPublicController {
  @Get()
  @Public()
  async list(@Paginate() query: PaginateQuery) {
    // chỉ trả published posts, publishedOnly: true
  }

  @Get(':slug')
  @Public()
  async getBySlug(@Param('slug') slug: string) { ... }
}
```

### AdminFeature
```typescript
export const BlogAdminFeature: AdminFeature = {
  resource: 'blog-management',
  controller: BlogAdminController,
  permissions: ['read', 'create', 'update', 'delete', 'publish'],
  menu: { label: 'Blog', icon: 'file-text', order: 5 },
};
```

---

## Phase 6 — Module + Seed Roles

```typescript
const BLOG_ROLES: SeedRoleDefinition[] = [
  {
    name: 'blog-editor',
    subjectType: 'admin',
    description: 'Full CRUD + publish blog posts và categories',
    permissions: { 'blog-management': ['read', 'create', 'update', 'delete', 'publish'] },
  },
  {
    name: 'blog-viewer',
    subjectType: 'admin',
    description: 'Read-only blog management',
    permissions: { 'blog-management': ['read'] },
  },
];
```

Module providers:
```typescript
{ provide: BLOG_POST_REPOSITORY, useClass: PrismaBlogPostRepository }
{ provide: BLOG_CATEGORY_REPOSITORY, useClass: PrismaBlogCategoryRepository }
{ provide: ADMIN_FEATURE, useValue: BlogAdminFeature, multi: true }
CreateBlogPostUseCase, UpdateBlogPostUseCase, DeleteBlogPostUseCase,
GetBlogPostUseCase, ListBlogPostsUseCase, PublishBlogPostUseCase, UnpublishBlogPostUseCase,
CreateBlogCategoryUseCase, UpdateBlogCategoryUseCase, DeleteBlogCategoryUseCase, ListBlogCategoriesUseCase,
```

Import vào `app.module.ts` — thêm `BlogModule` sau `NotificationModule`, trước `IntegrationModule`.

---

## Phase 7 — IntegrationModule Handler

File: `core/integration/handlers/on-blog-post-published.handler.ts`
```typescript
@Injectable()
export class OnBlogPostPublishedHandler {
  @OnEvent('blog.post_published')
  async handle(event: BlogPostPublishedEvent): Promise<void> {
    await this.sendNotification.execute({
      targets: [{ kind: 'all-admins' }],
      title: 'Bài viết mới được publish',
      body: `"${event.title}" đã được publish`,
      type: 'info',
      senderType: 'system',
    });
  }
}
```

Thêm handler vào `IntegrationModule`.

---

## Phase 8 — Frontend

### Types (`types/index.ts`)
```typescript
export type BlogPostStatus = 'draft' | 'published' | 'archived'

export interface BlogPost {
  id: string; slug: string; title: string; content: string
  excerpt: string | null; status: BlogPostStatus
  coverFileId: string | null; categoryId: string | null
  tags: string[]; authorId: string | null
  metaTitle: string | null; metaDesc: string | null
  publishedAt: string | null; createdAt: string; updatedAt: string
}

export interface BlogCategory {
  id: string; name: string; slug: string
  description: string | null; coverFileId: string | null
  createdAt: string; updatedAt: string
}

export interface BlogListResponse { data: BlogPost[]; meta: PaginatedMeta }
export interface CategoryListResponse { data: BlogCategory[]; meta: PaginatedMeta }
```

### Services (`services/blog.service.ts`)
```typescript
export const blogService = {
  getPosts:       (params: NestjsPaginateParams) => apiClient.get('/admin/blog-posts', { params }).then(r => r.data),
  getPost:        (id: string)    => apiClient.get(`/admin/blog-posts/${id}`).then(r => r.data.data),
  createPost:     (dto: CreatePostDto) => apiClient.post('/admin/blog-posts', dto).then(r => r.data),
  updatePost:     (id, dto) => apiClient.patch(`/admin/blog-posts/${id}`, dto).then(r => r.data),
  deletePost:     (id)      => apiClient.delete(`/admin/blog-posts/${id}`).then(r => r.data),
  publishPost:    (id)      => apiClient.post(`/admin/blog-posts/${id}/publish`).then(r => r.data),
  unpublishPost:  (id)      => apiClient.post(`/admin/blog-posts/${id}/unpublish`).then(r => r.data),
  getCategories:  (params?) => apiClient.get('/admin/blog-categories', { params }).then(r => r.data),
  createCategory: (dto)     => apiClient.post('/admin/blog-categories', dto).then(r => r.data),
  updateCategory: (id, dto) => apiClient.patch(`/admin/blog-categories/${id}`, dto).then(r => r.data),
  deleteCategory: (id)      => apiClient.delete(`/admin/blog-categories/${id}`).then(r => r.data),
}
```

### Hooks
```
hooks/
├── useBlogPosts.ts       // useBlogPosts(params), useCreatePost, useUpdatePost, useDeletePost, usePublishPost, useUnpublishPost
└── useBlogCategories.ts  // useBlogCategories(params), useCreateCategory, useUpdateCategory, useDeleteCategory
```

Pattern: `keepPreviousData`, `JSON.stringify(params)` trong queryKey, invalidate sau mutation — giống `useAdmins.ts`.

### Components
```
components/
├── BlogPage.tsx           // DataTable posts + tab switch sang Categories
├── BlogPostModal.tsx      // Form tạo/sửa bài viết (Dialog)
└── BlogCategoryModal.tsx  // Form tạo/sửa danh mục (Dialog)
```

**BlogPage — DataTable config:**
```typescript
const table = useDataTable<BlogPostRow>({
  tableId: 'blog-posts',
  showSearch: true,
  searchPlaceholder: 'Tìm theo tiêu đề, nội dung...',
  showFilters: true,
  showColumnVisibility: true,
  showDensityToggle: true,
  showRefreshButton: true,
  syncToUrl: true,
  persistPageSize: true, persistFilters: true, persistSort: true,
})
```

**Columns:**
| key | sortable | filterable | filterType |
|-----|----------|-----------|------------|
| title | ✓ | — | — |
| status | ✓ | ✓ | select (draft/published/archived) |
| category.name | — | ✓ | select (dynamic từ useBlogCategories) |
| publishedAt | ✓ | — | — |
| createdAt | ✓ | — | — |
| actions | — | — | hideable: false |

**BlogPostModal — Form fields (React Hook Form + Zod):**
- title: string, min 1
- slug: string (auto-gen từ title, có thể override)
- content: Textarea
- excerpt: Textarea optional
- categoryId: Select (options từ useBlogCategories)
- tags: Input chip (comma-separated hoặc Enter để add)
- status: Select (draft/published)
- coverFileId: Input text (MediaFile ID, future: media picker)
- metaTitle, metaDesc: optional strings

### Routes & Query Keys

`routes.ts`:
```typescript
BLOG: '/blog',
```

`shared/constants/index.ts`:
```typescript
BLOG: {
  POSTS:      ['blog', 'posts']      as const,
  POST:       ['blog', 'post']       as const,
  CATEGORIES: ['blog', 'categories'] as const,
},
```

`router.tsx`:
```typescript
const BlogPage = lazy(() => import('@modules/blog').then(m => ({ default: m.BlogPage })))
// thêm vào AdminGuard children:
{ path: ROUTES.BLOG, element: withSuspense(<BlogPage />) },
```

---

## Thứ tự Implementation

1. **Prisma** → thêm `BlogPost`, `BlogCategory` → `prisma migrate dev --name add-blog-module`
2. **Domain** → VOs (`blog-post-id.vo.ts`, `blog-category-id.vo.ts`) → Entities → Repository interfaces → Domain events
3. **Infrastructure** → Mappers → Prisma repositories
4. **Application** → 11 use-cases (post + category + publish/unpublish)
5. **Presentation BE** → AdminFeature → Admin controller → Public controller → Blog module → import vào app.module.ts
6. **IntegrationModule** → `OnBlogPostPublishedHandler` → thêm vào providers
7. **Frontend types + service**
8. **Frontend hooks** — `useBlogPosts.ts`, `useBlogCategories.ts`
9. **Frontend components** — `BlogPage.tsx`, `BlogPostModal.tsx`, `BlogCategoryModal.tsx`
10. **Router** — thêm route + QUERY_KEYS + ROUTES constant
11. **index.ts** — export public API

---

## Files cần tạo/sửa

### Backend — Tạo mới (28 files)
```
be-base/prisma/schema.prisma                                         (sửa)
be-base/prisma/migrations/.../migration.sql                          (tạo)
be-base/src/app.module.ts                                            (sửa)
be-base/src/core/integration/integration.module.ts                   (sửa)
be-base/src/core/integration/handlers/on-blog-post-published.handler.ts (tạo)

be-base/src/modules/blog/domain/value-objects/blog-post-id.vo.ts
be-base/src/modules/blog/domain/value-objects/blog-category-id.vo.ts
be-base/src/modules/blog/domain/entities/blog-post.entity.ts
be-base/src/modules/blog/domain/entities/blog-category.entity.ts
be-base/src/modules/blog/domain/repositories/blog-post.repository.ts
be-base/src/modules/blog/domain/repositories/blog-category.repository.ts
be-base/src/modules/blog/domain/events/blog-post-created.event.ts
be-base/src/modules/blog/domain/events/blog-post-published.event.ts

be-base/src/modules/blog/application/use-cases/create-blog-post.use-case.ts
be-base/src/modules/blog/application/use-cases/update-blog-post.use-case.ts
be-base/src/modules/blog/application/use-cases/delete-blog-post.use-case.ts
be-base/src/modules/blog/application/use-cases/get-blog-post.use-case.ts
be-base/src/modules/blog/application/use-cases/list-blog-posts.use-case.ts
be-base/src/modules/blog/application/use-cases/publish-blog-post.use-case.ts
be-base/src/modules/blog/application/use-cases/unpublish-blog-post.use-case.ts
be-base/src/modules/blog/application/use-cases/create-blog-category.use-case.ts
be-base/src/modules/blog/application/use-cases/update-blog-category.use-case.ts
be-base/src/modules/blog/application/use-cases/delete-blog-category.use-case.ts
be-base/src/modules/blog/application/use-cases/list-blog-categories.use-case.ts

be-base/src/modules/blog/infrastructure/mappers/blog-post.mapper.ts
be-base/src/modules/blog/infrastructure/mappers/blog-category.mapper.ts
be-base/src/modules/blog/infrastructure/repositories/prisma-blog-post.repository.ts
be-base/src/modules/blog/infrastructure/repositories/prisma-blog-category.repository.ts

be-base/src/modules/blog/presentation/admin/blog-admin.controller.ts
be-base/src/modules/blog/presentation/admin/blog-admin.feature.ts
be-base/src/modules/blog/presentation/public/blog-public.controller.ts

be-base/src/modules/blog/blog.module.ts
```

### Frontend — Tạo mới (8 files)
```
fe-base-admin/src/modules/blog/types/index.ts
fe-base-admin/src/modules/blog/services/blog.service.ts
fe-base-admin/src/modules/blog/hooks/useBlogPosts.ts
fe-base-admin/src/modules/blog/hooks/useBlogCategories.ts
fe-base-admin/src/modules/blog/components/BlogPage.tsx
fe-base-admin/src/modules/blog/components/BlogPostModal.tsx
fe-base-admin/src/modules/blog/components/BlogCategoryModal.tsx
fe-base-admin/src/modules/blog/index.ts
```

### Frontend — Sửa (3 files)
```
fe-base-admin/src/app/router.tsx
fe-base-admin/src/config/routes.ts
fe-base-admin/src/shared/constants/index.ts
```

---

## Verification

```bash
# BE build
cd be-base && npm run build   # zero TS errors

# Migration
npx prisma migrate dev --name add-blog-module

# Manual tests
# 1. POST /admin/blog-posts { title, content, status: 'draft' }
# 2. POST /admin/blog-posts/:id/publish → emit 'blog.post_published'
# 3. NotificationBell badge tăng (admin nhận thông báo) ✓
# 4. GET /blog-posts → chỉ trả published posts (không cần auth) ✓
# 5. GET /blog-posts/:slug → chi tiết bài viết ✓
# 6. DELETE /admin/blog-categories/:id → posts liên quan vẫn còn (categoryId = null) ✓
# 7. Admin role 'blog-viewer' chỉ GET được, không POST/PATCH/DELETE → 403 ✓

# FE
cd fe-base-admin && npm run type-check && npm run lint
# 8. Navigate /blog → BlogPage render DataTable ✓
# 9. Search theo title → re-fetch với search param ✓
# 10. Filter status=draft → chỉ hiện draft posts ✓
# 11. Tạo bài viết → modal submit → row mới xuất hiện trong table ✓
```
