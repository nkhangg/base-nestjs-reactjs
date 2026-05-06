# CLAUDE.md — fe-base-admin

Admin portal template — React 19 + Vite + TypeScript. Module-based, clean architecture, dễ mở rộng.

---

## Tech Stack

| Layer | Thư viện |
|---|---|
| Framework | React 19 + Vite 6 |
| Language | TypeScript 5.6 (strict) |
| Routing | React Router DOM v7 (library mode) |
| Server state | TanStack Query v5 |
| HTTP | Axios 1.7 với interceptors |
| Forms | React Hook Form + Zod |
| UI | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| Toast | Sonner |
| Realtime | Socket.IO client |
| i18n | i18next + react-i18next (vi/en) |
| Global state | React Context + useReducer |
| Testing | Vitest + React Testing Library + jsdom |
| Linting | ESLint 9 (flat config) + Prettier |

---

## Project Structure

```
src/
├── app/                  # Provider composition + centralized router
│   ├── App.tsx
│   └── router.tsx        # createBrowserRouter với lazy loading
│
├── modules/              # Feature modules — isolated, self-contained
│   ├── auth/             # Login, Register, ForgotPassword, ResetPassword, AuthGuard
│   ├── admin/            # Admin management, Role management, AdminGuard
│   ├── user/             # User management
│   ├── audit/            # Audit log viewer
│   ├── blog/             # Blog posts + categories + editor
│   ├── config/           # Key-value config + JSON editor
│   ├── dashboard/        # Dashboard + health check
│   ├── media/            # File manager + folder sidebar + MediaPicker
│   ├── notification/     # Bell, dropdown, page, WebSocket
│   └── profile/          # Profile page + change password
│
├── shared/               # Code dùng chung, không chứa business logic
│   ├── components/ui/    # shadcn components + DataTable + custom
│   ├── layouts/          # MainLayout (sidebar), AuthLayout (minimal)
│   ├── hooks/            # useDebounce, useLocalStorage, useDisclosure
│   ├── utils/            # cn(), formatNumber, formatDate, cleanPayload
│   ├── types/            # ApiResponse, PaginatedResult, BaseEntity
│   ├── constants/        # ROUTES, QUERY_KEYS, DATE_FORMAT, BREAKPOINTS
│   └── i18n/             # I18nProvider + locales/vi.json + en.json
│
├── lib/                  # Infrastructure / third-party integrations
│   ├── api-client/       # Axios instance + interceptors
│   ├── query-client.ts   # TanStack Query config
│   ├── storage.ts        # localStorage wrapper (prefix: app_)
│   └── error-handler.ts  # HTTP status → AppError mapping
│
├── store/                # Global app state (theme, locale)
│   └── app-store.tsx     # Context + useReducer
│
└── config/
    ├── env.ts            # Env var validation
    ├── routes.ts         # ROUTES constants
    └── app.config.ts     # Feature flags, pagination defaults
```

### Module Docs
Chi tiết từng module nằm ở `.claude/modules/`:

| File | Nội dung |
|---|---|
| `modules/auth.md` | Login, register, forgot/reset password, AuthGuard |
| `modules/admin.md` | Admin management, role management, AdminGuard |
| `modules/user.md` | User management |
| `modules/audit.md` | Audit log viewer |
| `modules/blog.md` | Blog posts, categories, markdown editor |
| `modules/config.md` | Key-value config, JSON object editor |
| `modules/dashboard.md` | Dashboard, health check |
| `modules/media.md` | File manager, upload, folder, MediaPicker |
| `modules/notification.md` | WebSocket, bell, dropdown, send page |
| `modules/profile.md` | Profile, change password |
| `modules/shared-ui.md` | DataTable pattern, shared UI components |

---

## Development Rules (BẮT BUỘC)

### 1. Shared UI — luôn dùng component có sẵn
- **Kiểm tra `src/shared/components/ui/` trước** khi viết HTML/CSS thuần.
- Nếu phát hiện có component sẵn nhưng bị viết lại → refactor ngay.
- Component mới mang tính tổng quát → đặt vào `shared/components/ui/`.

### 2. Toast & Confirm
- **Toast:** `toast.success/error/info/warning()` từ `sonner` — **không dùng** `window.alert()`.
- **Confirm:** `ConfirmDialog` từ `@shared/components/ui/confirm-dialog` — **không dùng** `window.confirm()`.
- **Form dialog:** `Dialog + DialogContent` từ `@shared/components/ui/dialog`.

### 3. Import rules (enforced bởi ESLint)
- **Luôn dùng path alias** — không dùng relative path (`../../`):
  `@shared/*`, `@modules/*`, `@lib/*`, `@store/*`, `@config/*`
- **Chỉ import qua `index.ts`** của module — không import sâu vào nội bộ:
  ```ts
  // ĐÚNG
  import { useAuth } from '@modules/auth'
  // SAI
  import { useAuth } from '@modules/auth/hooks/use-auth'
  ```

### 4. State
- **Server state:** TanStack Query cho mọi API call.
- **Form state:** React Hook Form + Zod.
- **Logic tách biệt:** API calls trong `services/`, data hooks trong `hooks/` — không viết trong component.

---

## Routing (`src/app/router.tsx`)

```
AuthLayout:
  /login, /register, /forgot-password, /reset-password

AuthGuard → MainLayout:
  /dashboard, /profile

AdminGuard → MainLayout:
  /admin, /admin/roles, /users, /configs, /audit-logs
  /media, /notifications, /blog

AdminGuard (full-screen, no sidebar):
  /blog/new, /blog/:id/edit

* → redirect /dashboard
```

- **Lazy loading:** mỗi page dùng `React.lazy()` + `<Suspense fallback={<PageLoader />}>`
- **Route constants:** luôn dùng `ROUTES.*` từ `src/config/routes.ts`
- **Guard pattern:** module tự cung cấp guard (`AuthGuard`, `AdminGuard`)

---

## API Layer

**Axios instance** (`src/lib/api-client/instance.ts`):
- Request interceptor: tự gắn cookie (withCredentials) hoặc token từ localStorage
- Response interceptor: 401 → refresh token → retry; nếu refresh fail → redirect `/login`
- Lỗi map qua `handleApiError()` → `AppError { message, status, code }`

**Service pattern:**
```ts
export const authService = {
  login: (dto: LoginDto) => apiClient.post<LoginResponse>('/auth/login', dto),
  getMe: () => apiClient.get<CurrentUser>('/auth/me'),
}
```

**Hook pattern:**
```ts
export const useCurrentUser = () => useQuery({
  queryKey: QUERY_KEYS.AUTH.ME,
  queryFn: authService.getMe,
})

export const useLogin = () => useMutation({ mutationFn: authService.login })
```

---

## State Management

| Layer | Tool | Scope |
|---|---|---|
| Server state | TanStack Query v5 | API data, `staleTime: 5m`, `gcTime: 10m` |
| Form state | React Hook Form + Zod | Form inputs |
| Global app state | Context + useReducer | Theme, locale, init status |
| Persistent | `storage` utility | localStorage với prefix `app_` |

TanStack Query retry: không retry 401/403/404.

---

## QUERY_KEYS (`src/shared/constants/index.ts`)

```ts
QUERY_KEYS = {
  AUTH: { ME, SESSION },
  DASHBOARD: { STATS },
  ADMIN: { USERS },
  CONFIGS,
  MEDIA: { FILES, FOLDERS },
  AUDIT_LOGS,
  NOTIFICATIONS: { LIST, UNREAD_COUNT, SENT },
  BLOG: { POSTS, POST, CATEGORIES },
  HEALTH,
}
```
Luôn dùng key từ đây khi `invalidateQueries` hoặc `queryKey`.

---

## Naming Conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| Component | PascalCase | `AdminPage.tsx`, `DataTable.tsx` |
| Hook | camelCase với `use` prefix | `useAuth`, `useDisclosure` |
| Service | camelCase object | `authService`, `adminService` |
| Types/Interfaces | PascalCase | `LoginDto`, `ApiResponse<T>` |
| Files (utilities) | kebab-case | `error-handler.ts` |
| Query keys | array constants | `['auth', 'me']` |

---

## Thêm Module Mới

```
src/modules/<feature>/
├── components/     # Page components, modals
├── guards/         # Route guards (nếu cần)
├── hooks/          # useQuery/useMutation wrappers
├── services/       # API calls
├── types/          # DTO, model types
└── index.ts        # Public API exports
```

Checklist:
1. Export qua `index.ts`
2. Thêm lazy import + route vào `src/app/router.tsx`
3. Thêm route constant vào `src/config/routes.ts`
4. Thêm query keys vào `src/shared/constants/index.ts`

---

## Commands

```bash
npm run dev            # Dev server (port 5173)
npm run build          # tsc + vite build → dist/
npm run preview        # Preview production build
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix
npm run format         # Prettier
npm run test           # Vitest watch
npm run test:coverage  # Coverage (v8)
npm run type-check     # tsc --noEmit
```

---

## Environment Variables

| Variable | Mô tả |
|---|---|
| `VITE_APP_NAME` | Tên ứng dụng |
| `VITE_APP_VERSION` | Version |
| `VITE_API_BASE_URL` | Backend base URL |
| `VITE_API_TIMEOUT` | Request timeout (ms) |
| `VITE_TOKEN_KEY` | localStorage key cho access token |
| `VITE_REFRESH_TOKEN_KEY` | localStorage key cho refresh token |
