# Module: auth

Authentication cho consumer app — unified auth page (login + register + inline forgot password).

## Structure

```
src/modules/auth/
├── components/
│   ├── AuthPage.tsx              # Unified two-column auth page (login + register tabs)
│   ├── AuthLeftPanel.tsx         # Dark marketing left panel (desktop only)
│   ├── LoginForm.tsx             # Form đăng nhập (email + password + Google OAuth)
│   ├── RegisterForm.tsx          # Form tạo tài khoản (firstName/lastName + strength bar + terms)
│   ├── ForgotPasswordInline.tsx  # Inline forgot password state (within AuthPage)
│   ├── ForgotPasswordForm.tsx    # Standalone form cho /forgot-password page
│   ├── ResetPasswordForm.tsx     # Form nhập mật khẩu mới (đọc token từ query param)
│   ├── PasswordStrengthBar.tsx   # Thanh strength indicator (score 0-4)
│   └── GoogleIcon.tsx            # Google SVG logo
├── hooks/
│   ├── useAuth.ts               # useCurrentUser, useLogin, useRegister, useLogout, ...
│   └── useGoogleLogin.ts        # Load GIS SDK + popup flow → POST /auth/oauth/login
├── services/
│   └── auth.service.ts          # API calls: login, register, logout, getMe, ...
├── types/
│   └── index.ts                 # LoginDto, RegisterDto, CurrentUser, ...
└── index.ts
```

## Public API

```typescript
import {
  AuthPage,
  AuthLeftPanel,
  LoginForm, RegisterForm,
  ForgotPasswordForm, ForgotPasswordInline,
  ResetPasswordForm, PasswordStrengthBar,
  useCurrentUser, useLogin, useRegister, useLogout,
  useChangePassword, useForgotPassword, useResetPassword,
  useGoogleLogin,
} from '@modules/auth'
import type { CurrentUser, LoginDto, OAuthLoginDto, RegisterDto } from '@modules/auth'
```

## Routes

| Route | Page | Component |
|---|---|---|
| `/login` | `(auth)/login/page.tsx` | `<AuthPage defaultTab="login" />` |
| `/register` | `(auth)/register/page.tsx` | `<AuthPage defaultTab="register" />` |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | `<ForgotPasswordForm />` |
| `/reset-password?token=...` | `(auth)/reset-password/page.tsx` | `<ResetPasswordForm />` |
| `/verify-email` | `(auth)/verify-email/page.tsx` | — |

## Layout

- `(auth)/layout.tsx` là passthrough `<>{children}</>` — AuthPage tự mang full-screen layout
- AuthPage: `grid lg:grid-cols-2` — left panel (dark, desktop only) + right panel (form)
- Mobile: chỉ right panel full-width, logo nhỏ hiện ở đầu form

## AuthPage behavior

- `defaultTab` prop: `'login'` (default) | `'register'`
- Tab state managed locally — tab switcher hidden khi `showForgot === true`
- Forgot password: inline state (không navigate) — `ForgotPasswordInline` render thay `LoginForm`
- Google OAuth: `useGoogleLogin()` load script `accounts.google.com/gsi/client`, gọi `initTokenClient` lấy `access_token`, rồi POST `/auth/oauth/login` với `{ provider:'google', accessToken, type:'user' }`. Cần env `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (khớp với BE `GOOGLE_CLIENT_ID`).

## API Endpoints

| Hook | Method | Endpoint |
|---|---|---|
| `useLogin` | POST | `/auth/login` |
| `useGoogleLogin` | POST | `/auth/oauth/login` (sau khi GIS popup trả access_token) |
| `useRegister` | POST | `/auth/register` |
| `useLogout` | POST | `/auth/logout` |
| `useCurrentUser` | GET | `/auth/me` |
| `useForgotPassword` | POST | `/auth/forgot-password` |
| `useResetPassword` | POST | `/auth/reset-password` |

## Query Keys

```typescript
QUERY_KEYS.AUTH.ME       // ['auth', 'me']
QUERY_KEYS.AUTH.SESSION  // ['auth', 'session']
```

## Notes

- **Không có AuthGuard component** — protection handled bởi `src/middleware.ts`
- `useLogin` + `useRegister` dùng `useRouter().push()` để navigate (Next.js)
- `ResetPasswordForm` đọc `token` từ `useSearchParams()` — component phải wrap trong `<Suspense>`
- `RegisterDto` có cả `firstName`/`lastName` lẫn `name` (computed từ first+last)
