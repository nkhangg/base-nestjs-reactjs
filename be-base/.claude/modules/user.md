# Module: modules/user

## Mục đích
Quản lý user accounts. Implement `ICredentialValidator` để AuthModule xác thực user login.

## Cấu trúc
```
modules/user/
├── domain/
│   ├── entities/user.entity.ts
│   ├── repositories/user.repository.ts   # USER_REPOSITORY symbol
│   └── value-objects/user-id.vo.ts
├── application/use-cases/
│   ├── create-user.use-case.ts
│   ├── get-user.use-case.ts
│   ├── list-users.use-case.ts
│   ├── update-user-role.use-case.ts
│   └── deactivate-user.use-case.ts
├── infrastructure/
│   ├── mappers/user.mapper.ts
│   └── repositories/
│       ├── in-memory-user.repository.ts
│       └── prisma-user.repository.ts
├── presentation/user/
│   ├── user-management.controller.ts    # /admin/users (AdminAuthGuard)
│   └── user-management.feature.ts
└── user.module.ts    # Seed USER_ROLES on onModuleInit, migrate existing users
```

## API Routes (`/admin/users`)

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/users` | read |
| POST | `/admin/users` | create |
| GET | `/admin/users/:id` | read |
| PATCH | `/admin/users/:id/role` | update |
| DELETE | `/admin/users/:id` | delete |

## Seeded Roles

| Role | SubjectType | Parent | Resources |
|---|---|---|---|
| base | user | — | notifications (r) |
| member | user | base | profile (r/u), orders (c/r), reviews (c/r/u/d), wishlist (c/r/d), notifications (r/u) |

## Domain Events Published
- `user.created` — sau khi tạo user thành công
- `user.deactivated` — sau khi deactivate user
