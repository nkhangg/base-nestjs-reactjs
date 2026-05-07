# Module: modules/profile

## Mục đích
Trang cá nhân của admin đang đăng nhập: xem/sửa thông tin, đổi mật khẩu.

## Cấu trúc
```
modules/profile/
├── components/
│   └── ProfilePage.tsx        # Thông tin cá nhân + trigger ChangePasswordModal
├── hooks/
│   └── useProfile.ts          # useUpdateProfile, useChangePassword
├── services/
│   └── profile.service.ts
├── types/
│   └── index.ts               # UpdateProfileDto, ChangePasswordDto
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/profile` | `ProfilePage` | `AuthGuard` |

## Types
- `ProfileData`: `userId`, `email`, `firstName?`, `lastName?`, `phone?`, `avatarUrl?`, `createdAt?`, `isActive?`, `role?`, `isAdmin?`
- `UpdateProfileDto`: `firstName?`, `lastName?`, `phone?`, `avatarUrl?`

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/auth/me` | dùng chung `useCurrentUser` từ `@modules/auth` |
| GET | `/auth/profile` | `useProfile` |
| PATCH | `/auth/profile` | `useUpdateProfile` |
| DELETE | `/auth/sessions/:id` | `useRevokeSession` |
| GET | `/auth/sessions` | `useSessions` |
| PATCH | `/auth/change-password` | `useChangePassword` |

## Ghi chú
- BE đã đổi field `name` → `firstName` + `lastName` (breaking change)
- Form profile có 3 fields: Họ (firstName), Tên (lastName), Số điện thoại (phone)
- Avatar initial tính từ `firstName + lastName` ghép lại
