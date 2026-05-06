# Module: modules/auth

## Mục đích
Authentication flow: login, register, forgot/reset password, change password. Cung cấp `AuthGuard` bảo vệ routes cần đăng nhập.

## Cấu trúc
```
modules/auth/
├── components/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   └── ChangePasswordModal.tsx
├── guards/
│   └── AuthGuard.tsx              # Redirect /login nếu chưa auth
├── hooks/
│   └── useAuth.ts                 # useLogin, useLogout, useCurrentUser, useForgotPassword, useResetPassword
├── services/
│   └── auth.service.ts
├── types/
│   └── index.ts                   # LoginDto, CurrentUser, ForgotPasswordDto, ResetPasswordDto
└── index.ts
```

## Public API (`index.ts`)
```ts
export { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage }
export { AuthGuard }
export { useAuth, useLogin, useLogout, useCurrentUser }
export type { LoginDto, CurrentUser }
```

## Routes
| Route | Component | Layout |
|---|---|---|
| `/login` | `LoginPage` | `AuthLayout` |
| `/register` | `RegisterPage` | `AuthLayout` |
| `/forgot-password` | `ForgotPasswordPage` | `AuthLayout` |
| `/reset-password` | `ResetPasswordPage` | `AuthLayout` |

## AuthGuard
```tsx
// Dùng làm layout wrapper trong router:
{ element: withSuspense(<AuthGuard />), children: [...] }

// Nội bộ: check useCurrentUser → redirect /login nếu unauthenticated
```

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| POST | `/auth/login` | `useLogin` |
| POST | `/auth/logout` | `useLogout` |
| POST | `/auth/refresh` | tự động qua Axios interceptor |
| GET | `/auth/me` | `useCurrentUser` (query) |
| POST | `/auth/forgot-password` | `useForgotPassword` |
| POST | `/auth/reset-password` | `useResetPassword` |
| PATCH | `/auth/change-password` | `useChangePassword` |

## Query Keys
`QUERY_KEYS.AUTH.ME` — profile hiện tại.
