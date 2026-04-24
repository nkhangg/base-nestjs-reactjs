# Kế hoạch: Module Configable

## Context

Module Configable là một hệ thống lưu trữ cấu hình linh hoạt dạng key-value (JSON). Mục đích:
- **fe-client** đọc data để render UI (header, footer, homepage sections, banners,…)
- **fe-admin** chủ động tạo/quản lý config bất kỳ theo nhu cầu
- Có thể bật/tắt từng config mà không cần xóa
- Dữ liệu JSON tự do — không ràng buộc schema cứng

> Tên module: `config` (không dùng `@nestjs/config` trong project này nên không xung đột)
> Prisma model: `app_configs` để tránh từ khóa dự phòng.

---

## Tính năng đề xuất

### Core (bắt buộc)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | CRUD config | Tạo / đọc / sửa / xóa config |
| 2 | Key dot-notation | Key dạng `homepage.hero`, `footer.links`, `app.maintenance` |
| 3 | Value JSON tự do | Lưu object, array, string, number, boolean — bất kỳ |
| 4 | Toggle bật/tắt | `isEnabled` — tắt config mà không xóa |
| 5 | Scope access | `scope: 'public' \| 'authenticated' \| 'admin'` — tích hợp với auth + authorization modules |
| 6 | Batch read API | `GET /configs/batch?keys=k1,k2,k3` — lấy nhiều config 1 request |

### Nâng cao (đề xuất thêm)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 7 | In-memory cache | Cache config với TTL 5 phút, invalidate khi update/toggle/delete |
| 8 | Tags | Label config để filter (`['homepage', 'layout', 'seo']`) |
| 9 | Audit trail | `createdBy` / `updatedBy` — adminId ghi vào mỗi thay đổi |

> **Version history & rollback**: Không implement trong module này — đã có kế hoạch module Audit riêng sẽ capture mọi thay đổi (old value, new value, actor). Tránh duplicate dữ liệu.

---

## ConfigKey Convention

```
Pattern: ^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$
Max length: 128 ký tự

Ví dụ hợp lệ:
  homepage.hero
  homepage.featured-products
  footer.nav-links
  app.maintenance-mode
  email.welcome-template
  seo.meta-default

Ví dụ không hợp lệ:
  Homepage.Hero     ← uppercase
  app settings      ← khoảng trắng
  .broken           ← bắt đầu bằng dấu chấm
  app..double       ← dấu chấm liên tiếp
```

Validate trong `ConfigKey` value object — throw lỗi khi tạo entity với key không hợp lệ.

---

## Những thứ cần thiết

### Dependencies
Không cần thêm package mới — dùng Prisma + NestJS sẵn có.

### Prisma Model

```prisma
model AppConfig {
  id          String   @id
  key         String   @unique   // dot-notation key
  value       Json               // JSON tự do
  description String?            // mô tả cho admin
  isEnabled   Boolean  @default(true)
  scope       String   @default("public")
  //  'public'        → ai cũng đọc được (không cần auth)
  //  'authenticated' → phải có JWT hợp lệ (bất kỳ entity: user/admin/merchant)
  //  'admin'         → chỉ admin đọc được
  tags        String[]           // nhãn phân loại: ['homepage', 'layout']
  createdBy   String?            // adminId
  updatedBy   String?            // adminId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isEnabled, scope])
  @@map("app_configs")
}
```

> Không có `AppConfigHistory` — lịch sử thay đổi do module Audit đảm nhiệm.

---

## Phân quyền đọc Config — Tích hợp Auth + Authorization

**Nguyên tắc**: mỗi `scope` ánh xạ sang 1 guard/endpoint riêng, không mix if/else logic trong 1 controller.

```
scope = 'public'        → /configs        → @Public()         → không qua auth/authorization
scope = 'authenticated' → /configs/me     → PermissionGuard   → jwt.middleware + RBAC check
scope = 'admin'         → /admin/configs  → AdminAuthGuard     → admin JWT + RBAC check
```

### Luồng request đầy đủ

```
GET /configs/:key  (scope='public')
  → jwt.middleware chạy (không bắt buộc có token)
  → @Public() → AuthGuard bỏ qua
  → Controller: findByKey, chỉ trả nếu scope='public' + isEnabled=true

GET /configs/me/:key  (scope='authenticated')
  → jwt.middleware chạy → set req.user
  → PermissionGuard: can(subject, 'configs', 'read') → 401/403 nếu không hợp lệ
  → Controller: trả nếu scope IN ('public','authenticated') + isEnabled=true

GET /admin/configs  (scope='admin' + CRUD)
  → jwt.middleware chạy → set req.user
  → AdminAuthGuard: kiểm tra adminRole + RBAC
  → @RequirePermission('config-management', action)
  → Controller: toàn quyền, không lọc scope
```

---

## API Routes

### Public — `@Public()`, không cần auth

| Method | Path | Điều kiện trả về | Mô tả |
|--------|------|-----------------|-------|
| `GET` | `/configs/batch?keys=k1,k2` | `scope='public' + isEnabled` | Batch đọc nhiều config |
| `GET` | `/configs/:key` | `scope='public' + isEnabled` | Đọc 1 config public |

> `/configs/batch` PHẢI khai báo TRƯỚC `/configs/:key`

### Authenticated — `PermissionGuard` + `@Permission('configs', 'read')`

| Method | Path | Điều kiện trả về | Mô tả |
|--------|------|-----------------|-------|
| `GET` | `/configs/me/batch?keys=k1,k2` | `scope IN ('public','authenticated') + isEnabled` | Batch cho entity đã đăng nhập |
| `GET` | `/configs/me/:key` | `scope IN ('public','authenticated') + isEnabled` | Đọc 1 config khi đã auth |

> Dùng `PermissionGuard` từ `core/authorization` — cùng RBAC flow với user/merchant routes.
> `/configs/me/batch` PHẢI khai báo TRƯỚC `/configs/me/:key`

### Admin — `AdminAuthGuard` + `@RequirePermission`

| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `GET` | `/admin/configs` | `config-management` read | List configs (paginated, filter scope/tags/isEnabled) |
| `POST` | `/admin/configs` | `config-management` create | Tạo config mới |
| `GET` | `/admin/configs/:id` | `config-management` read | Chi tiết config |
| `PATCH` | `/admin/configs/:id` | `config-management` update | Sửa value/description/tags/scope |
| `PATCH` | `/admin/configs/:id/toggle` | `config-management` update | Bật/tắt isEnabled |
| `DELETE` | `/admin/configs/:id` | `config-management` delete | Xóa config |

> `/admin/configs/:id/toggle` PHẢI khai báo TRƯỚC... thực ra không xung đột vì suffix `/toggle` không match `:id` alone. Nhưng vẫn nên đặt trước `:id` routes theo convention.

---

## Cấu trúc module Backend

```
be-base/src/modules/config/
├── domain/
│   ├── entities/
│   │   └── app-config.entity.ts          # Extends BaseAggregate
│   ├── repositories/
│   │   └── config.repository.ts          # Interface + Symbol token CONFIG_REPOSITORY
│   └── value-objects/
│       ├── config-id.vo.ts
│       └── config-key.vo.ts              # Validates dot-notation pattern
│
├── application/
│   ├── use-cases/
│   │   ├── create-config.use-case.ts
│   │   ├── get-config-by-key.use-case.ts      # cache → DB, nhận scope filter làm tham số
│   │   ├── get-configs-batch.use-case.ts      # nhận keys[] + allowedScopes[]
│   │   ├── list-configs.use-case.ts           # Admin: paginated + filter
│   │   ├── update-config.use-case.ts          # → invalidate cache
│   │   ├── toggle-config.use-case.ts          # → invalidate cache
│   │   └── delete-config.use-case.ts          # → invalidate cache
│   └── services/
│       └── config-cache.service.ts            # In-memory TTL cache (clone PermissionCache)
│           # TTL: 5 phút, key: config key string, invalidate(key), clear()
│
├── infrastructure/
│   ├── mappers/
│   │   └── config.mapper.ts
│   └── repositories/
│       ├── prisma-config.repository.ts
│       └── in-memory-config.repository.ts    # Dùng cho unit tests
│
├── presentation/
│   ├── admin/
│   │   ├── config-admin.controller.ts        # /admin/configs (AdminAuthGuard + RBAC)
│   │   └── config-admin.feature.ts           # AdminFeature registration
│   ├── public/
│   │   └── config-public.controller.ts       # /configs — @Public(), scope='public' only
│   └── authenticated/
│       └── config-auth.controller.ts         # /configs/me — PermissionGuard
│
└── config.module.ts
```

---

## Cache Strategy

```
ConfigCacheService (clone pattern từ PermissionCache):
  - Storage: Map<string, { value: AppConfig; expiresAt: number }>
  - TTL: 5 phút (300_000ms)
  - Key: config key string (e.g., 'homepage.hero')
  - get(key): AppConfig | null
  - set(key, config): void
  - invalidate(key): void   ← gọi sau update, toggle, delete
  - clear(): void

Flow đọc:
  GET /configs/:key
    → ConfigCacheService.get(key)
    → hit  → return cached
    → miss → ConfigRepository.findByKey(key)
           → ConfigCacheService.set(key, result)
           → return result
```

---

## Seeding Roles

```typescript
// config.module.ts — onModuleInit, idempotent via authorizationService.seedRoles()

// Admin — config-management resource
{ name: 'admin',  subjectType: 'admin',    permissions: { 'config-management': ['read','create','update','delete'] } }
{ name: 'viewer', subjectType: 'admin',    permissions: { 'config-management': ['read'] } }
// super-admin kế thừa wildcard '*' — đã có sẵn

// User — configs resource (đọc scope='authenticated')
{ name: 'member', subjectType: 'user',     permissions: { 'configs': ['read'] } }
// premium kế thừa member — tự động có

// Merchant — configs resource
{ name: 'staff',  subjectType: 'merchant', permissions: { 'configs': ['read'] } }
// manager, owner kế thừa staff — tự động có
```

> `config-management` (admin CRUD) và `configs` (client read) là 2 resource RBAC khác nhau.

---

## Cấu trúc module Frontend (fe-base-admin)

```
fe-base-admin/src/modules/config/
├── components/
│   ├── ConfigPage.tsx              # Danh sách: search, filter scope/tags/isEnabled
│   └── ConfigFormModal.tsx         # Create/Edit: key, JSON textarea, description, scope, tags
├── hooks/
│   ├── useConfigs.ts               # useQuery list (paginated)
│   ├── useConfig.ts                # useQuery single by id
│   ├── useCreateConfig.ts          # useMutation POST
│   ├── useUpdateConfig.ts          # useMutation PATCH :id
│   ├── useToggleConfig.ts          # useMutation PATCH :id/toggle
│   └── useDeleteConfig.ts          # useMutation DELETE :id
├── services/
│   └── config.service.ts
├── types/
│   └── index.ts                    # AppConfig, ConfigScope, CreateConfigDto, UpdateConfigDto
└── index.ts
```

### Files cần chỉnh sửa

| File | Thay đổi |
|------|----------|
| `be-base/prisma/schema.prisma` | Thêm `AppConfig` model |
| `be-base/src/app.module.ts` | Import `ConfigModule` |
| `fe-base-admin/src/app/router.tsx` | Thêm route `/admin/configs` |
| `fe-base-admin/src/config/routes.ts` | Thêm `ROUTES.ADMIN_CONFIGS` |
| `fe-base-admin/src/shared/constants/QUERY_KEYS.ts` | Thêm `CONFIGS` query keys |

---

## Ví dụ sử dụng thực tế

```typescript
// fe-client (không auth): fetch nhiều config public 1 lần
const res = await fetch('/configs/batch?keys=homepage.hero,footer.links,app.maintenance-mode')
// → { 'homepage.hero': { title: '...', image: '...' }, 'footer.links': [...] }

// fe-client (đã auth): fetch config có scope='authenticated'
const res = await fetch('/configs/me/batch?keys=user.dashboard-layout,app.features', {
  headers: { Authorization: `Bearer ${token}` }
})

// fe-admin: tạo config mới
POST /admin/configs
{
  "key": "promo.flash-sale-2025",
  "value": { "discount": 30, "ends": "2025-12-31", "banner": "https://..." },
  "description": "Flash sale cuối năm",
  "scope": "public",
  "tags": ["promo", "homepage"]
}

// Toggle tắt flash sale mà không xóa
PATCH /admin/configs/:id/toggle
// → isEnabled: false → /configs/batch không trả config này nữa
```

---

## Thứ tự Implementation

1. **Prisma schema** — thêm `AppConfig`, chạy `prisma migrate dev --name add-configable-module`
2. **Domain layer** — `AppConfig` entity, `ConfigKey` VO (validation), repository interface
3. **ConfigCacheService** — clone PermissionCache, TTL 5 phút
4. **Infrastructure repos** — `PrismaConfigRepository` + `InMemoryConfigRepository`
5. **Application use-cases** — create → get → batch → list → update → toggle → delete
6. **Presentation (BE)**:
   - `config-public.controller.ts` (`/configs`, `@Public()`)
   - `config-auth.controller.ts` (`/configs/me`, `PermissionGuard`)
   - `config-admin.controller.ts` (`/admin/configs`, `AdminAuthGuard`)
   - `config-admin.feature.ts` (AdminFeature registration)
7. **Module** — `config.module.ts` (seedRoles on init) + import vào `app.module.ts`
8. **Frontend types & service** — `types/index.ts`, `config.service.ts`
9. **Frontend hooks** — useConfigs, useCreateConfig, useUpdateConfig, useToggleConfig, useDeleteConfig
10. **Frontend components** — `ConfigPage`, `ConfigFormModal`
11. **Router** — thêm route `/admin/configs` vào `router.tsx` + `routes.ts`

---

## Verification

```bash
# Backend
cd be-base
npx prisma migrate dev --name add-configable-module
npm run build          # zero TypeScript errors
npm test               # unit tests pass
npm run start:dev

# Smoke test — Public (không auth)
curl -X POST http://localhost:3000/admin/configs \
  -d '{"key":"homepage.hero","value":{"title":"Hello"},"scope":"public","tags":["homepage"]}'

curl http://localhost:3000/configs/homepage.hero
# → { key: 'homepage.hero', value: { title: 'Hello' }, isEnabled: true }

curl "http://localhost:3000/configs/batch?keys=homepage.hero,footer.links"

# Toggle tắt → không còn trả về nữa
curl -X PATCH http://localhost:3000/admin/configs/:id/toggle
curl http://localhost:3000/configs/homepage.hero  # → 404

# Authenticated scope
curl http://localhost:3000/configs/me/homepage.hero -H "Authorization: Bearer <user-token>"

# Frontend
cd fe-base-admin
npm run type-check      # zero errors
npm run lint
npm run dev             # Vào /admin/configs → tạo, toggle, filter, xóa config
```
