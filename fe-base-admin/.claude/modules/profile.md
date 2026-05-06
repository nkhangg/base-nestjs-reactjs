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

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/auth/me` | dùng chung `useCurrentUser` từ `@modules/auth` |
| PATCH | `/profile` | `useUpdateProfile` |
| PATCH | `/auth/change-password` | `useChangePassword` |
