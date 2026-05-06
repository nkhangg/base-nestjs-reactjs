# Module: modules/admin

## Mục đích
Quản lý admin accounts, role assignments, sessions và auth logs. Implement `ICredentialValidator` để AuthModule xác thực admin login.

## Cấu trúc
```
modules/admin/
├── domain/
│   ├── entities/admin.entity.ts
│   ├── repositories/admin.repository.ts   # ADMIN_REPOSITORY symbol
│   └── value-objects/admin-id.vo.ts
├── application/
│   ├── use-cases/
│   │   ├── create-admin.use-case.ts
│   │   ├── get-admin.use-case.ts
│   │   ├── list-admins.use-case.ts
│   │   ├── update-admin-role.use-case.ts
│   │   ├── deactivate-admin.use-case.ts
│   │   ├── list-admin-sessions.use-case.ts
│   │   ├── get-auth-logs.use-case.ts
│   │   ├── list-roles.use-case.ts
│   │   ├── get-role.use-case.ts
│   │   ├── create-role.use-case.ts
│   │   ├── update-role.use-case.ts
│   │   └── delete-role.use-case.ts
│   └── validators/admin-credential.validator.ts   # implements ICredentialValidator
├── infrastructure/
│   ├── mappers/admin.mapper.ts
│   ├── repositories/
│   │   ├── in-memory-admin.repository.ts
│   │   └── prisma-admin.repository.ts
│   └── seeders/admin.seeder.ts
├── presentation/
│   ├── admin/
│   │   ├── admin-management.controller.ts
│   │   ├── admin-session.controller.ts
│   │   └── admin-management.feature.ts
│   └── roles/
│       ├── role-management.controller.ts
│       └── role-management.feature.ts
└── admin.module.ts    # Seed ADMIN_ROLES on onModuleInit
```

## API Routes

### Admin Management (`/admin/management`)
| Method | Path | Permission |
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
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/roles` | read (paginate: filter subjectType, search) |
| GET | `/admin/roles/resources` | read (**khai báo TRƯỚC `:id`**) |
| GET | `/admin/roles/:id` | read |
| POST | `/admin/roles` | create |
| PATCH | `/admin/roles/:id` | update |
| DELETE | `/admin/roles/:id` | delete |

## Seeded Roles

| Role | SubjectType | Parent | Permissions |
|---|---|---|---|
| base | admin | — | notifications → read |
| super-admin | admin | base | `*` → all actions |

## Gotchas
- `Admin.role` (string trong DB) là role name để lookup trong AuthorizationService khi seed assignments — khác với RBAC Role entity.
- `admin.seeder.ts` — tạo default super-admin account nếu chưa có.
- `admin-credential.validator.ts` implement `ICredentialValidator` với `subjectType = 'admin'`.
