# CLAUDE.md — client

Nihongo Learning — consumer-facing Next.js app. Module-based, clean architecture, adapted từ fe-base-admin.

---

## Tech Stack

| Layer | Thư viện |
|---|---|
| Framework | Next.js 16.2.5 + React 19 (App Router) |
| Language | TypeScript 5 (strict) |
| Routing | Next.js App Router (file-based, route groups) |
| Server state | TanStack Query v5 |
| HTTP | Axios 1.7 với interceptors |
| Forms | React Hook Form + Zod |
| UI | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Toast | Sonner |
| Theme | next-themes |
| Realtime | Socket.IO client |
| i18n | i18next + react-i18next (vi/en) |
| Global state | React Context + useReducer |

---

## Project Structure

```
src/
├── app/                       # Next.js App Router
│   ├── (public)/              # Marketing pages — PublicLayout
│   │   ├── layout.tsx
│   │   ├── pricing/page.tsx
│   │   └── blog/
│   ├── (auth)/                # Auth pages — AuthLayout
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── ...
│   ├── (onboarding)/          # Onboarding flow
│   ├── (app)/                 # Protected pages — AppLayout (sidebar)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── progress/page.tsx
│   │   └── ...
│   ├── (learning)/            # Full-screen learning — LearningLayout
│   │   ├── flashcards/page.tsx
│   │   ├── grammar/page.tsx
│   │   └── mock-test/page.tsx
│   ├── layout.tsx             # Root layout (server component)
│   ├── Providers.tsx          # "use client" — QueryClient, Theme, I18n, Store
│   ├── page.tsx               # Landing page (wraps PublicLayout)
│   └── globals.css
│
├── modules/                   # Feature modules — isolated, self-contained
│   ├── auth/                  # Login, Register, Forgot/Reset password
│   ├── dashboard/             # Stats, heatmap, module cards
│   ├── notification/          # Bell, dropdown, Socket.IO
│   └── [module]/              # Mỗi module: components/ hooks/ services/ types/ index.ts
│
├── shared/
│   ├── components/ui/         # shadcn/ui components (tất cả có 'use client')
│   ├── layouts/               # AppLayout, AuthLayout, LearningLayout, PublicLayout
│   ├── hooks/                 # useDebounce, useDisclosure, useLocalStorage
│   ├── utils/                 # cn(), formatDate, formatNumber, cleanPayload
│   ├── types/                 # ApiResponse<T>, PaginatedResult<T>, BaseEntity
│   ├── constants/             # ROUTES, QUERY_KEYS, DATE_FORMAT
│   └── i18n/                  # I18nProvider + locales/vi.json + en.json
│
├── lib/
│   ├── api-client/            # Axios instance + interceptors
│   ├── query-client.ts        # TanStack Query config
│   ├── storage.ts             # localStorage wrapper (prefix: app_)
│   └── error-handler.ts       # HTTP status → AppError
│
├── store/
│   └── app-store.tsx          # 'use client' — locale, isInitialized
│
├── config/
│   ├── env.ts                 # NEXT_PUBLIC_* env vars
│   ├── routes.ts              # ROUTES constants
│   └── app.config.ts          # Feature flags
│
└── middleware.ts               # Edge middleware — auth route protection
```

### Module Docs

| File | Nội dung |
|---|---|
| `modules/auth.md` | Login, register, forgot/reset password |
| `modules/dashboard.md` | Stats, heatmap, module list |
| `modules/notification.md` | Bell, dropdown, Socket.IO |
| `modules/shared-ui.md` | shadcn/ui components, layouts |

---

## Development Rules (BẮT BUỘC)

### 1. "use client" directive
- **BẮT BUỘC** trên mọi file dùng hooks (`useState`, `useEffect`, `useQuery`...), event handlers, hoặc browser API (`localStorage`, `window`...).
- `page.tsx` files là **server components** — import client component từ module để render.
- `src/lib/`, `src/config/` — không cần "use client" (pure functions).

```typescript
// src/app/(app)/dashboard/page.tsx — server component ✓
import { DashboardPage } from '@modules/dashboard'
export default function Page() { return <DashboardPage /> }

// src/modules/dashboard/components/DashboardPage.tsx
'use client'   // ← BẮT BUỘC
import { useDashboardStats } from '../hooks/useDashboard'
```

### 2. Routing — Next.js thuần
- Navigation: `useRouter()` + `router.push()` từ `next/navigation`
- Links: `<Link href="...">` từ `next/link`
- Active path: `usePathname()` từ `next/navigation`
- **KHÔNG dùng** `react-router-dom`

### 3. Import rules
- **Luôn dùng path alias** — không dùng relative path (`../../`):
  `@shared/*`, `@modules/*`, `@lib/*`, `@store/*`, `@config/*`
- **Chỉ import qua `index.ts`** của module:
  ```ts
  // ĐÚNG
  import { useCurrentUser } from '@modules/auth'
  // SAI
  import { useCurrentUser } from '@modules/auth/hooks/useAuth'
  ```

### 4. State
- **Server state:** TanStack Query cho mọi API call.
- **Form state:** React Hook Form + Zod.
- **API calls trong `services/`**, data hooks trong `hooks/` — không viết trong component.

### 5. Shared UI
- **Kiểm tra `src/shared/components/ui/` trước** khi viết HTML/CSS thuần.
- Toast: `toast.success/error()` từ `sonner`.

---

## Routing

```
/ → page.tsx (LandingPage, wraps PublicLayout)

(public) layout: PublicLayout
  /pricing
  /blog
  /blog/[slug]

(auth) layout: AuthLayout
  /login, /register, /forgot-password, /reset-password, /verify-email

(onboarding) layout: minimal centered
  /onboarding

(app) layout: AppLayout (sidebar)
  /dashboard, /progress, /profile, /settings, /billing

(learning) layout: LearningLayout (full-screen)
  /flashcards, /grammar, /mock-test

* → next → 404 (not-found.tsx)
```

**Auth protection:** `src/middleware.ts` (Next.js Edge middleware) — kiểm tra session cookie, redirect về `/login` nếu chưa đăng nhập.

---

## API Layer

**Axios instance** (`src/lib/api-client/instance.ts`):
- Request interceptor: gắn Bearer token từ localStorage
- Response interceptor: 401 → retry 1 lần → redirect `/login` nếu fail
- Lỗi map qua `handleApiError()` → `AppError { message, status, code }`

---

## State Management

| Layer | Tool |
|---|---|
| Server state | TanStack Query v5 — `staleTime: 5m`, `gcTime: 10m` |
| Form state | React Hook Form + Zod |
| Global app state | Context + useReducer (locale, isInitialized) |
| Theme | next-themes (class strategy) |
| Persistent | `storage` utility (localStorage, prefix `app_`) |

---

## Naming Conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| Component | PascalCase | `LoginForm.tsx`, `DashboardPage.tsx` |
| Hook | camelCase với `use` prefix | `useCurrentUser`, `useDashboardStats` |
| Service | camelCase object | `authService`, `dashboardService` |
| Types/Interfaces | PascalCase | `LoginDto`, `CurrentUser` |
| Files (utilities) | kebab-case | `error-handler.ts` |

---

## Thêm Module Mới

```
src/modules/<feature>/
├── components/    # Page components, modals — thêm 'use client'
├── hooks/         # useQuery/useMutation — thêm 'use client'
├── services/      # API calls (không cần 'use client')
├── types/         # DTO, model types
└── index.ts       # Public API exports
```

Checklist:
1. Tạo module theo cấu trúc trên
2. Export qua `index.ts`
3. Tạo `page.tsx` trong route group phù hợp (app/auth/learning/public)
4. Thêm route constant vào `src/config/routes.ts`
5. Thêm query keys vào `src/shared/constants/index.ts`
6. Thêm `.claude/modules/<feature>.md`

---

## Commands

```bash
npm run dev            # Dev server (Turbopack)
npm run build          # Next.js build → .next/
npm run start          # Production server
npm run lint           # ESLint check
npm run format         # Prettier
npm run type-check     # tsc --noEmit
```

---

## Environment Variables

| Variable | Mô tả |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Tên ứng dụng |
| `NEXT_PUBLIC_APP_VERSION` | Version |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL (required) |
| `NEXT_PUBLIC_API_TIMEOUT` | Request timeout (ms) |
| `NEXT_PUBLIC_TOKEN_KEY` | localStorage key cho access token |
| `NEXT_PUBLIC_REFRESH_TOKEN_KEY` | localStorage key cho refresh token |

Copy `.env.local.example` → `.env.local` và điền giá trị.
