# CLAUDE.md — fe-base-admin

Admin portal template built with React 19 + Vite + TypeScript. Mục tiêu: cấu trúc sạch, module-based, dễ mở rộng.

---

## Tech Stack

| Layer | Thư viện |
|-------|----------|
| Framework | React 19 + Vite 6 |
| Language | TypeScript 5.6 (strict) |
| Routing | React Router DOM v7 (library mode) |
| Server state | TanStack Query v5 |
| HTTP | Axios 1.7 với interceptors |
| Forms | React Hook Form + Zod |
| UI | Tailwind CSS 3.4 + shadcn/ui (Radix UI) |
| i18n | i18next + react-i18next (vi/en) |
| Global state | React Context + useReducer (không dùng Redux) |
| Testing | Vitest + React Testing Library + jsdom |
| Linting | ESLint 9 (flat config) + Prettier |

---

## Quy tắc Phát triển (Development Rules)

### 1. Ưu tiên Shared UI & Refactor (BẮT BUỘC)
* **Ưu tiên tuyệt đối:** Luôn kiểm tra và sử dụng các component có sẵn trong `src/shared/components/ui/` trước khi tự viết code HTML/CSS hoặc dùng thẻ tag thuần.
* **Nguyên tắc Refactor:** Nếu phát hiện component đã tồn tại trong `shared/components/ui/` nhưng lại được viết mới (ví dụ: dùng `div` và `fixed` để làm Modal thay vì dùng `Dialog` của shadcn), **phải tiến hành refactor lại ngay lập tức** để sử dụng component dùng chung.
* **Tính nhất quán:** Chỉ tự viết component mới khi tính năng đó hoàn toàn chưa có trong thư viện và không thể cấu hình từ các component hiện có. Nếu viết mới một UI component mang tính tổng quát, hãy đặt nó vào `shared/components/ui/`.

### 2. Import & Path Alias
* **Luôn dùng path alias:** Tuyệt đối không dùng relative path (`../../`). 
* **Aliases:** `@shared/*`, `@modules/*`, `@lib/*`, `@store/*`, `@config/*`.
* **Public API:** Chỉ import module qua file `index.ts` của module đó. Tránh import sâu vào nội bộ module khác.

### 3. State & Logic
* **Server State:** Sử dụng TanStack Query cho tất cả các thao tác liên quan đến API.
* **Form State:** Luôn sử dụng React Hook Form kết hợp với Zod để validation.
* **Logic Tách Biệt:** Giữ logic nghiệp vụ (API calls, data transformation) trong `services` và `hooks` của module, không viết trực tiếp trong component giao diện.

## Cấu trúc thư mục

```
src/
├── app/                  # Provider composition + centralized router
│   ├── App.tsx
│   └── router.tsx        # createBrowserRouter với lazy loading
│
├── modules/              # Feature modules — isolated, self-contained
│   ├── auth/
│   │   ├── components/   # LoginPage, RegisterPage
│   │   ├── guards/       # AuthGuard (route protection)
│   │   ├── hooks/        # useAuth, useLogin, useLogout, useCurrentUser
│   │   ├── services/     # authService (API calls)
│   │   ├── types/        # LoginDto, CurrentUser
│   │   └── index.ts      # Public API — chỉ import qua đây
│   │
│   ├── admin/
│   │   ├── components/   # AdminPage, RolePage, AdminDetailModal
│   │   ├── guards/       # AdminGuard (role-based protection)
│   │   ├── hooks/        # useAdmins, useRoles, useSessions
│   │   ├── services/     # adminService
│   │   ├── types/        # Admin, Role, Session
│   │   └── index.ts
│   │
│   └── dashboard/
│       └── components/   # DashboardPage
│
├── shared/               # Code dùng chung, không chứa business logic
│   ├── components/ui/    # shadcn components: Button, Input, Card, DataTable, ...
│   ├── layouts/          # MainLayout (sidebar), AuthLayout (minimal)
│   ├── hooks/            # useDebounce, useLocalStorage, useDisclosure
│   ├── utils/            # cn(), formatNumber, formatDate, cleanPayload, ...
│   ├── types/            # ApiResponse, PaginatedResult, BaseEntity, ID, ...
│   ├── constants/        # ROUTES, QUERY_KEYS, DATE_FORMAT, BREAKPOINTS
│   └── i18n/             # I18nProvider + locales/vi.json + en.json
│
├── lib/                  # Infrastructure / third-party integrations
│   ├── api-client/       # Axios instance + interceptors (auth, refresh, error)
│   ├── query-client.ts   # TanStack Query config (staleTime, gcTime, retry)
│   ├── storage.ts        # localStorage wrapper (prefix: app_)
│   └── error-handler.ts  # HTTP status → AppError mapping
│
├── store/                # Global app state (theme, locale)
│   └── app-store.tsx     # Context + useReducer
│
├── config/               # Configuration
│   ├── env.ts            # Env var validation (throwable requireEnv())
│   ├── routes.ts         # ROUTES constants object
│   └── app.config.ts     # Feature flags, pagination defaults
│
└── __tests__/            # Vitest tests
    ├── setup.ts
    ├── lib/
    └── shared/
```

---

## Routing

- **Centralized:** tất cả routes định nghĩa trong `src/app/router.tsx`
- **Lazy loading:** mỗi page dùng `React.lazy()` + `<Suspense fallback={<PageLoader />}>`
- **Guard pattern:** module tự cung cấp guard (`AuthGuard`, `AdminGuard`) dùng làm route wrapper
- **Route constants:** luôn dùng `ROUTES.*` từ `src/config/routes.ts`, không hardcode string

**Cấu trúc route:**
```
/login, /register         → AuthLayout
/dashboard                → MainLayout + AuthGuard
/admin, /admin/roles      → MainLayout + AdminGuard
*                         → redirect → /dashboard
```

---

## State Management

1. **Global app state** — `src/store/app-store.tsx`
   - Theme (light/dark), locale (vi/en), init status
   - Dùng React Context + useReducer, không dùng Redux

2. **Server state** — TanStack Query v5
   - `staleTime: 5 phút`, `gcTime: 10 phút`
   - Retry thông minh: không retry 401/403/404

3. **Form state** — React Hook Form + Zod validation

4. **Persistent state** — `storage` utility (localStorage với prefix `app_`)

---

## API Layer

**Axios instance** (`src/lib/api-client/instance.ts`):
- Request interceptor: tự gắn `Authorization: Bearer <token>` từ localStorage
- Response interceptor: 401 → refresh token → retry; nếu refresh fail → redirect `/login`
- Lỗi HTTP được map qua `handleApiError()` → `AppError { message, status, code }`

**Service pattern:**
```ts
// services/auth.service.ts
export const authService = {
  login: (dto: LoginDto) => apiClient.post<LoginResponse>('/auth/login', dto),
  getMe: () => apiClient.get<CurrentUser>('/auth/me'),
}
```

**Hook pattern (wrap service với TanStack Query):**
```ts
export const useCurrentUser = () => useQuery({
  queryKey: QUERY_KEYS.AUTH_ME,
  queryFn: authService.getMe,
})

export const useLogin = () => useMutation({ mutationFn: authService.login })
```

---

## Quy tắc Import (bắt buộc, enforced bởi ESLint)

1. **Luôn dùng path alias** — không dùng relative path:
   - `@shared/`, `@lib/`, `@modules/`, `@store/`, `@config/`

2. **Chỉ import module qua `index.ts`** — không import sâu vào nội bộ:
   ```ts
   // ĐÚNG
   import { useAuth } from '@modules/auth'
   // SAI
   import { useAuth } from '@modules/auth/hooks/use-auth'
   ```

3. Mỗi module phải có `index.ts` export public API của nó.

---

## Naming Conventions

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component | PascalCase | `AdminPage.tsx`, `DataTable.tsx` |
| Hook | camelCase với `use` prefix | `useAuth`, `useDisclosure` |
| Service | camelCase object | `authService`, `adminService` |
| Types/Interfaces | PascalCase | `LoginDto`, `ApiResponse<T>` |
| Files (utilities) | kebab-case | `error-handler.ts`, `api-client` |
| Query keys | array constants | `['auth', 'me']`, `['admins']` |

---

## Thêm Module Mới

```
src/modules/<feature>/
├── components/     # Page components, modals
├── guards/         # Route guards (nếu cần)
├── hooks/          # useQuery/useMutation wrappers
├── services/       # API calls
├── types/          # DTO, model types
├── store/          # Module-level state (optional)
└── index.ts        # Public API exports
```

Sau đó:
1. Export qua `index.ts`
2. Thêm route vào `src/app/router.tsx`
3. Thêm route constant vào `src/config/routes.ts`
4. Thêm query keys vào `src/shared/constants/`

---

## Commands

```bash
npm run dev            # Dev server (port 5173, proxy API → localhost:8080)
npm run build          # tsc + vite build → dist/
npm run preview        # Preview production build
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix lint
npm run format         # Prettier
npm run test           # Vitest watch
npm run test:coverage  # Coverage report (v8)
npm run type-check     # TypeScript check (no emit)
```

---

## Environment Variables

Khai báo trong `.env`, validate trong `src/config/env.ts`:

| Variable | Mô tả |
|----------|-------|
| `VITE_APP_NAME` | Tên ứng dụng |
| `VITE_APP_VERSION` | Version |
| `VITE_API_BASE_URL` | Backend base URL |
| `VITE_API_TIMEOUT` | Request timeout (ms) |
| `VITE_TOKEN_KEY` | localStorage key cho access token |
| `VITE_REFRESH_TOKEN_KEY` | localStorage key cho refresh token |

Xem `.env.example` để biết cấu trúc mẫu.

---

## Shared UI Components

Tất cả nằm trong `src/shared/components/ui/`, export qua `ui/index.ts`:
- **Form:** `Button`, `Input`, `Label`, `Select`
- **Layout:** `Card`, `Badge`, `DropdownMenu`
- **Data:** `DataTable` (sorting, filtering, pagination tích hợp)
- **Utility:** `ErrorBoundary`, `PageLoader`

---

## Feature Flags

Định nghĩa trong `src/config/app.config.ts`:
```ts
features: {
  darkMode: true,
  i18n: true,
  devtools: ENV.IS_DEV,  // React Query devtools chỉ bật khi dev
}
```
