# Module: modules/admin

## Mục đích
Quản lý admin accounts, roles (RBAC), và sessions. Cung cấp `AdminGuard` bảo vệ routes dành riêng cho admin.

## Cấu trúc
```
modules/admin/
├── components/
│   ├── AdminPage.tsx          # List + CRUD admins
│   ├── AdminDetailModal.tsx   # Xem / update admin
│   ├── AdminRolesModal.tsx    # Quản lý role assignment cho admin
│   └── RolePage.tsx           # CRUD roles + permissions
├── guards/
│   └── AdminGuard.tsx         # Kiểm tra user có adminRole
├── hooks/
│   ├── useAdmins.ts           # useAdminList, useCreateAdmin, useUpdateAdmin, useDeleteAdmin
│   ├── useAdminSessions.ts    # useSessions, useDeleteSession
│   └── useRoles.ts            # useRoleList, useCreateRole, useUpdateRole, useDeleteRole
├── services/
│   └── admin.service.ts
├── types/
│   └── index.ts               # Admin, Role, Permission, Session
└── index.ts
```

## Public API (`index.ts`)
```ts
export { AdminPage, RolePage }
export { AdminGuard }
export { useAdmins, useRoles, useAdminSessions }
export type { Admin, Role, Session }
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/admin` | `AdminPage` | `AdminGuard` |
| `/admin/roles` | `RolePage` | `AdminGuard` |

## AdminGuard
```tsx
// Dùng làm layout wrapper bao quanh tất cả admin routes:
{ element: withSuspense(<AdminGuard />), children: [...adminRoutes] }

// Nội bộ: check req.user.adminRole — redirect /dashboard nếu không có quyền
```

## API Endpoints

### Admin Management
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/management` | `useAdminList` |
| POST | `/admin/management` | `useCreateAdmin` |
| GET | `/admin/management/:id` | `useAdminDetail` |
| PATCH | `/admin/management/:id/role` | `useUpdateAdminRole` |
| DELETE | `/admin/management/:id` | `useDeleteAdmin` |
| GET | `/admin/management/:id/sessions` | `useSessions` |
| DELETE | `/admin/management/:id/sessions/:sessionId` | `useDeleteSession` |

### Role Management
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/roles` | `useRoleList` |
| POST | `/admin/roles` | `useCreateRole` |
| PATCH | `/admin/roles/:id` | `useUpdateRole` |
| DELETE | `/admin/roles/:id` | `useDeleteRole` |
| GET | `/admin/roles/resources` | `useRoleResources` |

## Query Keys
`QUERY_KEYS.ADMIN.USERS` — admin list.
