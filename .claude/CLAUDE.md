# be-base — Project Guide for Claude

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | Prisma (PostgreSQL) |
| Auth | JWT (access 15 min / refresh 30 days) via HTTP-only cookies |
| Validation | class-validator + class-transformer (`ValidationPipe({ whitelist: true })`) |
| Pagination | nestjs-paginate (`@Paginate()`, `PaginateQuery`, `ApiPaginationQuery`) |
| API Docs | Swagger / OpenAPI (`/docs`) |
| Testing | Jest (unit + integration, in-memory repos) |

---

## Project Structure

```
src/
├── main.ts                          # Bootstrap: CORS, cookieParser, Swagger, port 3000
├── app.module.ts                    # Root: PrismaModule, AuthorizationModule, AdminShellModule, AdminModule, AuthModule
│
├── core/                            # Cross-cutting infrastructure (không phụ thuộc module cụ thể)
│   ├── auth/                        # JWT auth core
│   │   ├── domain/
│   │   │   ├── entities/session.entity.ts
│   │   │   ├── repositories/session.repository.ts
│   │   │   └── services/            # token.service, auth-identity.interface, credential-validator.interface
│   │   ├── application/use-cases/   # login, logout, refresh-token
│   │   ├── infrastructure/
│   │   │   ├── jwt-token.service.ts
│   │   │   ├── jwt.middleware.ts    # Giải mã JWT → req.user (chạy cho mọi request)
│   │   │   ├── refresh.middleware.ts
│   │   │   ├── auth.guard.ts        # @Public() decorator để bypass
│   │   │   └── repositories/        # in-memory + prisma session repos
│   │   ├── presentation/http/auth.controller.ts
│   │   └── auth.module.ts           # AuthModule.forRoot({ jwt: {...}, imports: [...] })
│   │
│   ├── authorization/               # RBAC — @Global(), inject AuthorizationService bất kỳ đâu
│   │   ├── domain/
│   │   │   ├── entities/            # Role, Permission, RoleAssignment
│   │   │   ├── repositories/        # RoleRepository, PermissionRepository, RoleAssignmentRepository (interfaces)
│   │   │   └── value-objects/       # Subject.of(id, type), Action, SubjectType
│   │   ├── application/services/
│   │   │   └── authorization.service.ts  # can(), seedRoles(), assignRole(), createRole(), updateRole(), deleteRole()
│   │   ├── infrastructure/
│   │   │   ├── cache/permission-cache.ts  # In-memory TTL cache, invalidate sau mọi mutation
│   │   │   └── repositories/        # InMemory impls (Map-based) + Prisma impls (production)
│   │   ├── authorization.module.ts  # @Global() → AuthorizationService available everywhere
│   │   └── index.ts                 # Public exports
│   │
│   └── admin-shell/                 # Glue layer: kết nối AdminModule features với guard
│       ├── admin.interface.ts       # AdminFeature interface + ADMIN_FEATURE token
│       ├── admin-auth.guard.ts      # AdminAuthGuard: xác thực JWT + kiểm tra RBAC
│       ├── admin-route.registry.ts  # Đọc ADMIN_FEATURE multi-providers để build menu/permissions
│       ├── require-permission.decorator.ts  # @RequirePermission(resource, action)
│       └── admin-shell.module.ts    # AdminShellModule.forRoot() → global guard + registry
│
├── modules/
│   ├── user/                        # Feature module: quản lý user accounts
│   │   ├── domain/
│   │   │   ├── entities/user.entity.ts
│   │   │   ├── repositories/user.repository.ts
│   │   │   └── value-objects/user-id.vo.ts
│   │   ├── application/use-cases/   # create, get, list, update-role, deactivate user
│   │   ├── infrastructure/
│   │   │   ├── mappers/user.mapper.ts
│   │   │   └── repositories/        # in-memory + prisma user repos
│   │   ├── presentation/user/
│   │   │   ├── user-management.controller.ts   # /admin/users (AdminAuthGuard)
│   │   │   └── user-management.feature.ts      # AdminFeature registration
│   │   ├── user.module.ts           # Seed USER_ROLES on onModuleInit, migrate existing users
│   │   └── index.ts
│   │
│   └── admin/                       # Feature module: quản lý admin accounts + roles
│       ├── domain/
│       │   ├── entities/admin.entity.ts
│       │   ├── repositories/admin.repository.ts
│       │   └── value-objects/admin-id.vo.ts
│       ├── application/
│       │   ├── use-cases/           # create, get, list, update-role, deactivate admin; list/get/create/update/delete role; sessions; auth-logs
│       │   └── validators/admin-credential.validator.ts  # implements ICredentialValidator
│       ├── infrastructure/
│       │   ├── mappers/admin.mapper.ts
│       │   ├── repositories/
│       │   │   ├── in-memory-admin.repository.ts
│       │   │   └── prisma-admin.repository.ts   # Production repo
│       │   └── seeders/admin.seeder.ts
│       ├── presentation/
│       │   ├── admin/
│       │   │   ├── admin-management.controller.ts   # /admin/management
│       │   │   ├── admin-session.controller.ts      # /admin/management/:id/sessions
│       │   │   └── admin-management.feature.ts      # AdminFeature registration
│       │   └── roles/
│       │       ├── role-management.controller.ts    # /admin/roles
│       │       └── role-management.feature.ts       # AdminFeature registration
│       ├── admin.module.ts          # Seed ADMIN_ROLES on onModuleInit, register features
│       └── index.ts
│
├── shared/
│   ├── application/result.ts        # Result<T, E> union type
│   ├── domain/                      # Shared domain base types
│   └── infrastructure/prisma/       # PrismaModule + PrismaService
│
└── types/
    └── express.d.ts                 # Extend Express.Request: req.user { userId, adminRole, ... }
```

---

## Architecture Conventions

### Clean Architecture Layers
```
domain → application → infrastructure → presentation
```
- **domain**: entities, value objects, repository interfaces — zero framework deps
- **application**: use-cases + service orchestration — inject repos via interfaces
- **infrastructure**: Prisma repos, in-memory repos, cache, validators — implements domain interfaces
- **presentation**: controllers, DTOs, guards — NestJS-specific

### Pagination Pattern (nestjs-paginate)

Tất cả list endpoints **bắt buộc** dùng `nestjs-paginate` — không tự viết tay parse/build.

```ts
// Controller
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
  const { data, total } = await this.listUseCase.execute({
    page, pageSize: limit, search,
    sortBy: sortBy?.[0] as ...,
    sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
    isActive: filterBool(filter, 'isActive'),
  });
  return buildPaginated(data.map(mapFn), total, query, PAGINATE_CONFIG);
}
```

Response format (nestjs-paginate standard):
```json
{
  "data": [...],
  "meta": { "itemsPerPage", "totalItems", "currentPage", "totalPages", "sortBy", "search", "filter" },
  "links": { "first", "previous", "current", "next", "last" }
}
```

Helper functions trong `src/shared/application/paginate.ts`:
- `parsePage(query, config)` — trả về `{ page, limit, search, filter, sortBy }`
- `filterStr(filter, key)` — lấy string đầu tiên từ filter field
- `filterBool(filter, key)` — parse `"true"/"false"` → `boolean | undefined`
- `buildPaginated(data, total, query, config)` — build response + links

### Result<T, E> Pattern
Dùng cho use-cases có thể fail theo domain rules:
```ts
// src/shared/application/result.ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// Ví dụ use-case:
if (!result.ok) throw new NotFoundException(...)
const data = result.value  // TypeScript narrowing bắt buộc
```
**Lưu ý**: Use-cases KHÔNG bao giờ fail → trả thẳng `{data, total}` thay vì `Result<>`.

### Repository Injection Pattern
```ts
// Interface token
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY')
export interface RoleRepository { ... }

// Module binding
{ provide: ROLE_REPOSITORY, useClass: InMemoryRoleRepository }

// Inject trong service
constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository) {}
```

### AdminFeature Pattern — đăng ký feature mới
```ts
// presentation/my-feature/my.feature.ts
export const MyFeature: AdminFeature = {
  resource: 'my-resource',        // dùng trong @RequirePermission
  controller: MyController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: { label: 'My Feature', icon: 'icon-name', order: 3 },
}

// admin.module.ts — thêm vào providers
{ provide: ADMIN_FEATURE, useValue: MyFeature, multi: true }
```

---

## Authorization System (RBAC)

### SubjectType
`'admin' | 'user' | 'merchant' | '*'`

### Actions
`'create' | 'read' | 'update' | 'delete' | 'publish' | 'approve' | 'export'`

### Wildcard resource
Permission với resource `'*'` = grant tất cả resources.

### Role hierarchy
Role có thể có `parentId` → kế thừa permissions từ parent (đệ quy, cycle-safe).
`wouldCreateCycle()` trong `AuthorizationService` ngăn circular hierarchy.

### Permission check flow
```
Request → jwt.middleware (giải mã JWT → req.user)
       → AdminAuthGuard (xác thực adminRole + RBAC check qua AuthorizationService.can())
       → Controller (@RequirePermission('resource', 'action'))
```

### Cache
`PermissionCache` — in-memory TTL cache per `(subjectId, subjectType)`.
**Bắt buộc** gọi `cache.clear()` hoặc `cache.invalidate()` sau mọi mutation liên quan đến roles/permissions.

### Seeded roles (onModuleInit — idempotent)
| Role | Parent | Permissions |
|---|---|---|
| super-admin | — | `*` → all actions |
| viewer | — | `*` → read |
| moderator | viewer | `*` → update, approve |
| editor | viewer | `*` → create, update |
| admin | editor | `*` → delete |

---

## API Routes

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Đăng nhập → set cookie |
| POST | `/auth/logout` | Xóa cookie |
| POST | `/auth/refresh` | Refresh access token |

### User Management (`/admin/users`)
| Method | Path | Guard |
|---|---|---|
| GET | `/admin/users` | read |
| POST | `/admin/users` | create |
| GET | `/admin/users/:id` | read |
| PATCH | `/admin/users/:id/role` | update |
| DELETE | `/admin/users/:id` | delete |

### Admin Management (`/admin/management`)
| Method | Path | Guard |
|---|---|---|
| GET | `/admin/management` | read |
| POST | `/admin/management` | create |
| GET | `/admin/management/:id` | read |
| PATCH | `/admin/management/:id/role` | update |
| DELETE | `/admin/management/:id` | delete |
| GET | `/admin/management/:id/sessions` | read |
| GET | `/admin/management/:id/sessions/auth-logs` | read |
| DELETE | `/admin/management/:id/sessions/:sessionId` | delete |

### Role Management (`/admin/roles`)
| Method | Path | Guard |
|---|---|---|
| GET | `/admin/roles` | read (nestjs-paginate: filter subjectType, search, page, limit) |
| GET | `/admin/roles/resources` | read (**phải khai báo trước `:id`**) |
| GET | `/admin/roles/:id` | read |
| POST | `/admin/roles` | create |
| PATCH | `/admin/roles/:id` | update |
| DELETE | `/admin/roles/:id` | delete |

### PermissionGuard (user/merchant routes)
Dùng cho các routes không phải admin. Đọc `req.user.type` làm `subjectType`, kiểm tra RBAC.

```ts
// Generic — dùng khi cần kiểm soát subjectType qua metadata
@UseGuards(PermissionGuard)
@Permission('profile', 'read', { subjectType: 'user' })

// Typed — enforce đúng entity type + RBAC
@UseGuards(UserPermissionGuard)
@Permission('orders', 'create')

@UseGuards(MerchantPermissionGuard)
@Permission('products', 'update')
```

Import từ `core/authorization`:
```ts
import { PermissionGuard, UserPermissionGuard, MerchantPermissionGuard, Permission } from '../../core/authorization'
```

**Lưu ý**: `Permission` (decorator) và `PermissionEntity` (entity type) đều export từ index nhưng tên khác nhau để tránh collision.

### Seeded roles — User (`subjectType: 'user'`)
| Role | Parent | Resources |
|---|---|---|
| member | — | profile (r/u), orders (c/r), reviews (c/r/u/d), wishlist (c/r/d), notifications (r/u) |
| premium | member | premium-content (r), subscriptions (r) |

### Seeded roles — Merchant (`subjectType: 'merchant'`)
| Role | Parent | Resources |
|---|---|---|
| staff | — | products (r/u), orders (r/u), customers (r) |
| manager | staff | products (c/d), analytics (r/export), promotions (c/r/u/d) |
| owner | manager | `*` → all actions |

---

## Database (Prisma / PostgreSQL)

### Models
- `Session` — JWT refresh sessions
- `Admin` — admin accounts (email, passwordHash, role string, isActive)
- `User` — user accounts (email, passwordHash, role string, isActive)
- `Role` — RBAC roles với hierarchy (parentId self-relation)
- `RoleAssignment` — `(subjectId, subjectType, roleId)` unique
- `Permission` — `(roleId, resource, actions[])` — actions là `String[]`

### Lưu ý quan trọng
**Authorization dùng Prisma repositories** — roles/permissions/assignments persist qua DB, restart server không mất data.
Seeding (`seedRoles`) vẫn idempotent: dùng `upsert` nên gọi nhiều lần an toàn.

Prisma repos nằm tại `core/authorization/infrastructure/repositories/`:
- `prisma-role.repository.ts` — `findByName` dùng OR để match cả `subjectType='*'`
- `prisma-permission.repository.ts` — `saveMany` chạy trong một transaction
- `prisma-role-assignment.repository.ts` — `save` upsert theo unique key `(subjectId, subjectType, roleId)`

---

## Testing

```bash
npm test              # Chạy tất cả unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage
```

- Tests dùng **in-memory repositories** — không cần DB, không mock NestJS
- Factory pattern: `makeService()` tạo service + repos + cache fresh cho mỗi test
- `authorization.service.spec.ts` — 95+ tests bao gồm RBAC + CRUD roles + cache + hierarchy
- Use-case specs trong `modules/admin/application/use-cases/*.spec.ts`

---

## Key Rules & Gotchas

1. **Route ordering**: `GET /admin/roles/resources` PHẢI khai báo TRƯỚC `GET /admin/roles/:id` trong controller, nếu không NestJS sẽ treat "resources" như một role ID.

2. **nestjs-paginate**: Dùng `@Paginate() query: PaginateQuery` + `ApiPaginationQuery(config)`. Response format: `{ success, data, meta: { totalItems, currentPage, itemsPerPage, totalPages } }`.

3. **Result<T> narrowing**: Luôn phải `if (!result.ok)` trước khi access `result.value` — TypeScript không tự narrow.

4. **AuthorizationModule là @Global()**: Không cần import lại vào module khác — `AuthorizationService` inject trực tiếp.

5. **AdminAuthGuard**: Chỉ áp dụng cho routes dùng `@UseGuards(AdminAuthGuard)`. Guard đọc `req.user.adminRole` (set bởi `jwt.middleware`) → nếu thiếu trả 401.

6. **PermissionCache phải clear sau mutation**: Gọi `this.cache.clear()` trong `createRole`, `updateRole`, `deleteRole`, `seedRoles`. Thiếu bước này → cache stale, check permission sẽ sai.

7. **seedRoles là idempotent**: An toàn gọi nhiều lần trong `onModuleInit`. Không tạo duplicate nếu role đã tồn tại.

8. **Admin.role** (string trong DB) khác với RBAC role (entity trong authorization system). `admin.role` là role name được dùng để lookup trong `AuthorizationService` khi seed assignments.

9. **Multi-provider pattern** (`multi: true`): Dùng cho `CREDENTIAL_VALIDATORS` và `ADMIN_FEATURE` — inject như `@Inject(TOKEN) private readonly items: Item[]`.

10. **Pagination trong in-memory repos**: `listRoles` và `listAdmins` thực hiện filter + slice trong memory. Ổn vì data ít. Khi chuyển sang Prisma cần chuyển logic này vào DB query.
