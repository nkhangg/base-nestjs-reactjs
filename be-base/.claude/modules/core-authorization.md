# Module: core/authorization

## Mục đích
RBAC toàn app — quản lý roles, permissions, role assignments. `@Global()` nên `AuthorizationService` inject được ở mọi nơi mà không cần import lại module.

## Cấu trúc
```
core/authorization/
├── domain/
│   ├── entities/
│   │   ├── role.entity.ts           # { id, name, subjectType, parentId, permissions[] }
│   │   ├── permission.entity.ts     # { roleId, resource, actions[] }
│   │   └── role-assignment.entity.ts
│   ├── repositories/                # Interfaces: RoleRepository, PermissionRepository, RoleAssignmentRepository
│   └── value-objects/
│       ├── subject.vo.ts            # Subject.of(id, type)
│       ├── action.vo.ts
│       └── subject-type.vo.ts
├── application/services/
│   └── authorization.service.ts    # can(), seedRoles(), assignRole(), createRole(), updateRole(), deleteRole()
├── infrastructure/
│   ├── cache/permission-cache.ts   # In-memory TTL cache per (subjectId, subjectType)
│   └── repositories/
│       ├── in-memory-*.repository.ts   # Map-based, dùng trong tests
│       └── prisma-*.repository.ts      # Production
├── decorators/
│   ├── permission.decorator.ts     # @Permission('resource', 'action')
│   └── guards/
│       ├── permission.guard.ts       # Generic (đọc subjectType từ req.user.type)
│       ├── user-permission.guard.ts  # Enforce subjectType = 'user'
│       └── merchant-permission.guard.ts
├── authorization.module.ts          # @Global()
└── index.ts                         # Public exports
```

## API (dùng nội bộ — không expose HTTP trực tiếp)

`AuthorizationService` là service chính:

```ts
can(subject: Subject, action: Action, resource: string): Promise<boolean>
seedRoles(definitions: SeedRoleDefinition[]): Promise<void>  // idempotent
assignRole(subjectId: string, subjectType: string, roleId: string): Promise<void>
createRole(dto): Promise<Role>
updateRole(id, dto): Promise<Role>
deleteRole(id): Promise<void>
```

## Seeded Roles (Admin)

| Role | Parent | Permissions |
|---|---|---|
| base | — | `notifications` → read |
| super-admin | base | `*` → all actions |

## Seeded Roles — User (`subjectType: 'user'`)

| Role | Parent | Resources |
|---|---|---|
| base | — | notifications (r) |
| member | base | profile (r/u), orders (c/r), reviews (c/r/u/d), wishlist (c/r/d), notifications (r/u) |

## Seeded Roles — Merchant (`subjectType: 'merchant'`)

| Role | Parent | Resources |
|---|---|---|
| base | — | notifications (r) |
| owner | base | `*` → all actions |

## Patterns

### Role Hierarchy
Role có `parentId` → kế thừa permissions từ parent (đệ quy, cycle-safe).
`wouldCreateCycle()` ngăn circular hierarchy.

### Wildcard resource
Permission với `resource = '*'` = grant tất cả resources cho actions đó.

### PermissionCache
```ts
cache.get(subjectId, subjectType)   // check cache trước
cache.set(subjectId, subjectType, permissions)
cache.invalidate(subjectId, subjectType)  // sau assign/unassign role
cache.clear()                            // sau create/update/delete role
```
**Bắt buộc** clear cache sau mọi mutation — thiếu bước này → stale cache → check permission sai.

### SeedRoleDefinition format
```ts
const ROLES: SeedRoleDefinition[] = [{
  name: 'blog-editor',
  subjectType: 'admin',
  description: '...',
  permissions: {
    'blog-management': ['read', 'create', 'update', 'delete', 'publish'],
  },
}]
await this.authorizationService.seedRoles(ROLES);  // trong onModuleInit
```

### Guards cho user/merchant routes
```ts
import { PermissionGuard, UserPermissionGuard, MerchantPermissionGuard, Permission } from '../../core/authorization'

@UseGuards(UserPermissionGuard)
@Permission('orders', 'create')
```
`Permission` (decorator) và `PermissionEntity` (entity type) đều export — tên khác nhau để tránh collision.
