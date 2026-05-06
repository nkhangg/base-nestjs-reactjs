# Module: modules/user

## Mục đích
Quản lý user accounts (CRUD, role assignment, deactivate).

## Cấu trúc
```
modules/user/
├── components/
│   └── UserPage.tsx       # List + CRUD users, dùng DataTable
├── hooks/
│   └── useUsers.ts        # useUserList, useCreateUser, useUpdateUserRole, useDeleteUser
├── services/
│   └── user.service.ts
├── types/
│   └── index.ts           # User, CreateUserDto, UpdateUserRoleDto
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/users` | `UserPage` | `AdminGuard` |

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/users` | `useUserList` |
| POST | `/admin/users` | `useCreateUser` |
| GET | `/admin/users/:id` | `useUserDetail` |
| PATCH | `/admin/users/:id/role` | `useUpdateUserRole` |
| DELETE | `/admin/users/:id` | `useDeleteUser` |
