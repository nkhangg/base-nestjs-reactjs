# be-base — Project Guide for Claude

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | Prisma (PostgreSQL) |
| Auth | JWT (access 15 min / refresh 30 days) via HTTP-only cookies |
| Validation | class-validator + class-transformer (`ValidationPipe({ whitelist: true })`) |
| Pagination | nestjs-paginate (`@Paginate()`, `PaginateQuery`, `ApiPaginationQuery`) |
| Queue | BullMQ + Redis |
| Realtime | Socket.IO (via `@nestjs/platform-socket.io`) |
| API Docs | Swagger / OpenAPI (`/docs`) |
| Testing | Jest (unit + integration, in-memory repos) |

---

## Project Structure

```
src/
├── main.ts                   # Bootstrap: CORS, cookieParser, Swagger, port 3000
├── app.module.ts             # Root: PrismaModule + tất cả core + domain modules
│
├── core/                     # Cross-cutting infrastructure (không phụ thuộc domain cụ thể)
│   ├── auth/                 # JWT auth — login, logout, refresh, session
│   ├── authorization/        # RBAC — @Global(), roles, permissions, cache
│   ├── admin-shell/          # Glue: AdminFeature registration, AdminAuthGuard
│   ├── events/               # Domain event bus (@Global(), EventPublisher)
│   ├── queue/                # BullMQ setup (@Global(), Redis connection)
│   ├── integration/          # Event handlers → queue → notification
│   └── health/               # /health endpoint
│
├── modules/                  # Domain feature modules
│   ├── admin/                # Admin accounts + role management
│   ├── user/                 # User accounts
│   ├── merchant/             # Merchant accounts (skeleton)
│   ├── blog/                 # Blog posts + categories
│   ├── media/                # File storage (local / MinIO)
│   ├── config/               # Key-value config store
│   ├── notification/         # In-app notifications + WebSocket
│   └── audit/                # Audit log (AuditInterceptor)
│
├── shared/
│   ├── application/
│   │   ├── result.ts         # Result<T, E> union type
│   │   └── paginate.ts       # parsePage, filterStr, filterBool, filterBtw, buildPaginated
│   ├── domain/               # Shared base types
│   └── infrastructure/prisma/# PrismaModule + PrismaService
│
└── types/
    └── express.d.ts          # Extend Express.Request: req.user { userId, adminRole, ... }
```

### Module Docs
Chi tiết từng module nằm ở `.claude/modules/`:

| File | Nội dung |
|---|---|
| `modules/core-auth.md` | JWT auth, session, login/logout/refresh |
| `modules/core-authorization.md` | RBAC, roles, permissions, cache |
| `modules/core-admin-shell.md` | AdminFeature pattern, AdminAuthGuard |
| `modules/core-events.md` | Domain event bus, EventPublisher |
| `modules/core-queue.md` | BullMQ config, queue names |
| `modules/core-integration.md` | Event handlers, notification queue processor |
| `modules/admin.md` | Admin management, role management |
| `modules/user.md` | User management |
| `modules/blog.md` | Blog posts, categories, publish flow |
| `modules/media.md` | File upload, folders, storage provider |
| `modules/config.md` | Key-value config, cache, public/auth/admin APIs |
| `modules/notification.md` | Send, receive, WebSocket gateway |
| `modules/audit.md` | AuditInterceptor, audit log list |

---

## Architecture Conventions

### Clean Architecture Layers
```
domain → application → infrastructure → presentation
```
- **domain**: entities, value objects, repository interfaces — zero framework deps
- **application**: use-cases, services — inject repos qua interfaces
- **infrastructure**: Prisma repos, in-memory repos, cache, validators, gateways
- **presentation**: controllers, DTOs, guards — NestJS-specific

### Pagination Pattern (nestjs-paginate)

Tất cả list endpoints **bắt buộc** dùng `nestjs-paginate` — không tự parse/build tay.

```ts
import { Paginate, type PaginateQuery, ApiPaginationQuery, FilterOperator } from 'nestjs-paginate';
import { parsePage, filterStr, filterBool, buildPaginated } from '../../../shared/application/paginate';

const PAGINATE_CONFIG = {
  sortableColumns: ['email', 'createdAt'],
  searchableColumns: ['email'],
  filterableColumns: { isActive: [FilterOperator.EQ] },
  defaultLimit: 20,
  maxLimit: 100,
};

@Get()
@ApiPaginationQuery(PAGINATE_CONFIG)
async list(@Paginate() query: PaginateQuery) {
  const { page, limit, search, filter, sortBy } = parsePage(query, PAGINATE_CONFIG);
  const { data, total } = await this.listUseCase.execute({ page, pageSize: limit, search, ... });
  return buildPaginated(data.map(mapFn), total, query, PAGINATE_CONFIG);
}
```

Helpers trong `src/shared/application/paginate.ts`:
- `parsePage(query, config)` → `{ page, limit, search, filter, sortBy }`
- `filterStr(filter, key)` — lấy string đầu tiên từ filter field
- `filterBool(filter, key)` — parse `"true"/"false"` → `boolean | undefined`
- `filterBtw(filter, key)` — parse between range (dateFrom/dateTo)
- `buildPaginated(data, total, query, config)` — build response + links

### Result<T, E> Pattern
```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

if (!result.ok) throw new NotFoundException(...)
const data = result.value  // TypeScript narrowing bắt buộc
```
Use-cases không bao giờ fail → trả thẳng `{ data, total }` thay vì `Result<>`.

### Repository Injection Pattern
```ts
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY')
export interface RoleRepository { ... }

// Module binding
{ provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository }

// Inject
constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository) {}
```

### AdminFeature Pattern
```ts
export const MyFeature: AdminFeature = {
  resource: 'my-resource',
  controller: MyController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: { label: 'My Feature', icon: 'icon-name', order: 3 },
}

// Trong module providers:
{ provide: ADMIN_FEATURE, useValue: MyFeature, multi: true }
```

### Domain Events Pattern
```ts
// Publish event từ use-case
constructor(@Inject(DOMAIN_EVENT_BUS) private readonly events: IDomainEventBus) {}
await this.events.publish(new UserCreatedEvent(user));

// Handler trong IntegrationModule
@OnEvent('user.created')
async handle(event: UserCreatedEvent) { ... }
```

---

## Authorization System (RBAC)

### SubjectType
`'admin' | 'user' | 'merchant' | '*'`

### Actions
`'create' | 'read' | 'update' | 'delete' | 'publish' | 'approve' | 'export'`

### Permission check flow
```
Request → jwt.middleware (decode JWT → req.user)
       → AdminAuthGuard (check adminRole + RBAC qua AuthorizationService.can())
       → @RequirePermission('resource', 'action')
```

### PermissionGuard cho user/merchant routes
```ts
@UseGuards(UserPermissionGuard)
@Permission('orders', 'create')

@UseGuards(MerchantPermissionGuard)
@Permission('products', 'update')
```
Import từ `core/authorization`.

### PermissionCache
In-memory TTL cache per `(subjectId, subjectType)`. **Bắt buộc** gọi `cache.clear()` sau mọi mutation liên quan đến roles/permissions.

---

## Database (Prisma / PostgreSQL)

| Model | Mô tả |
|---|---|
| `Session` | JWT refresh sessions |
| `Admin` | Admin accounts (email, passwordHash, role, isActive) |
| `User` | User accounts |
| `Merchant` | Merchant accounts |
| `Role` | RBAC roles với hierarchy (parentId self-relation) |
| `RoleAssignment` | `(subjectId, subjectType, roleId)` unique |
| `Permission` | `(roleId, resource, actions[])` |
| `AuditLog` | Log mọi write action qua AuditInterceptor |
| `BlogPost` | Blog posts (slug, status, publishedAt) |
| `BlogCategory` | Blog categories |
| `MediaFile` | File metadata + storage path |
| `MediaFolder` | Folder hierarchy cho media |
| `AppConfig` | Key-value config store |
| `Notification` | Notification records |
| `NotificationRecipient` | Fan-out recipients (readAt, deletedAt) |

**seedRoles** luôn dùng `upsert` — idempotent, an toàn gọi nhiều lần trong `onModuleInit`.

---

## Testing

```bash
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage
```

- Tests dùng **in-memory repositories** — không cần DB, không mock NestJS
- Factory pattern: `makeService()` tạo fresh service + repos + cache cho mỗi test

---

## Key Rules & Gotchas

1. **Route ordering**: Static routes (`GET /roles/resources`) PHẢI khai báo TRƯỚC param routes (`GET /roles/:id`).

2. **AuthorizationModule là @Global()**: Không cần import lại — `AuthorizationService` inject trực tiếp.

3. **EventsModule và QueueModule là @Global()**: `DOMAIN_EVENT_BUS` và `BullModule` available toàn app.

4. **PermissionCache phải clear sau mutation**: Thiếu bước này → cache stale → check permission sai.

5. **Admin.role** (string trong DB) ≠ RBAC Role (entity). String này dùng để lookup khi seed assignments.

6. **Multi-provider pattern** (`multi: true`): Dùng cho `CREDENTIAL_VALIDATORS` và `ADMIN_FEATURE` — inject như `@Inject(TOKEN) private readonly items: Item[]`.

7. **STORAGE_TYPE env**: Media module chọn provider qua `process.env.STORAGE_TYPE` (`'local'` hoặc `'minio'`).

8. **IntegrationModule**: Là glue giữa domain events và notification queue — import `NotificationModule` nhưng không phải `@Global()`.

9. **Pagination in-memory repos**: Filter + slice trong memory. Ổn với data ít — khi scale sang Prisma cần chuyển logic vào DB query.
