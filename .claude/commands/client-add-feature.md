Thêm chức năng vào một module hoặc một page đã có trong dự án `client/` (Next.js App Router), theo đúng kiến trúc & convention sẵn có.

Dùng skill này khi: thêm component/hook/service mới vào module có sẵn, thêm action/filter/section mới vào page có sẵn, hoặc thêm một route mới vào module có sẵn.

Phân biệt với các skill khác:
- `/client-tweak` — chỉ tweak nhỏ trong file đã có (text, màu, spacing), không tạo file mới.
- `/client-page-from-ui` — tạo **module hoàn toàn mới** từ UI mẫu.
- `/client-add-feature` (skill này) — mở rộng module/page **đã tồn tại**.

## Arguments

`$ARGUMENTS` — một trong 3 dạng:

| Scope | Format | Ví dụ |
|---|---|---|
| **A. Add feature vào module** | `<module-name> <mô tả>` | `dashboard thêm card streak history`<br>`notification thêm filter theo loại` |
| **B. Add feature vào page (theo route)** | `<route-path> <mô tả>` | `/dashboard thêm filter theo tuần`<br>`/login thêm nút social login Google` |
| **C. Thêm route mới vào module có sẵn** | `<module-name> <new-route> <mô tả>` | `dashboard /dashboard/history trang lịch sử học`<br>`notification /notifications/settings trang cấu hình` |

Parse:
1. Nếu token đầu bắt đầu bằng `/` → **Scope B** (route → page → module)
2. Nếu token thứ 2 bắt đầu bằng `/` → **Scope C** (thêm route mới trong module)
3. Ngược lại → **Scope A** (module name + description)

Module name phải khớp một thư mục trong `client/src/modules/`. Nếu không khớp → dừng và báo user.

---

## STEP 1 — Resolve target & load module context

### Resolve target

**Scope A** (module + mô tả):
- Module name = token đầu
- Đọc `client/.claude/modules/<module-name>.md` để hiểu structure, route hiện có, components, hooks, API endpoints

**Scope B** (route + mô tả):
- Resolve route → file `client/src/app/(<group>)/<route>/page.tsx`
- Đọc page file để xem nó import component từ module nào
- Module name = thư mục đó dưới `src/modules/`
- Đọc `client/.claude/modules/<module-name>.md`

**Scope C** (module + new-route + mô tả):
- Module name = token đầu
- New route = token thứ 2 (bắt đầu bằng `/`)
- Đọc `client/.claude/modules/<module-name>.md` để biết module hiện tại thuộc route group nào → route mới đặt cùng group hoặc group khác tùy yêu cầu (hỏi user nếu không chắc)

Nếu module doc không tồn tại → báo user và dừng.

### Luôn đọc kèm

- `client/.claude/CLAUDE.md` — chỉ khi feature có yếu tố lạ với patterns của project (nếu chỉ là CRUD/UI thêm thì có thể bỏ qua vì đã rõ)
- `client/AGENTS.md` — Next.js project này có thể có breaking changes; nếu feature đụng tới Next.js APIs lạ (params, searchParams, middleware, route handlers...) → đọc thêm guide trong `client/node_modules/next/dist/docs/` trước khi viết code

---

## STEP 2 — Detect shared dependencies

Dựa vào mô tả feature, đọc thêm doc tương ứng trong `client/.claude/modules/`:

| Feature có yếu tố | Đọc thêm |
|---|---|
| Auth, login state, session, current user | `auth.md` |
| Bảng dữ liệu, form, modal, button, layout | `shared-ui.md` |
| Realtime, socket, notification bell | `notification.md` |
| Billing, subscription, plan | `billing.md` |
| Sidebar/nav item mới (page protected) | `shared-ui.md` (xem AppLayout) |
| Landing/marketing section | `landing.md` |

Chỉ đọc khi thực sự cần — không đọc thừa.

---

## STEP 3 — Đọc file source tối thiểu

Đọc đúng những file pattern-reference cần thiết (đều dưới `client/`):

- Thêm **component** mới → đọc 1 component tương tự trong module đó (`src/modules/<module>/components/*.tsx`)
- Thêm **hook** mới → đọc 1 hook trong `src/modules/<module>/hooks/*.ts`
- Thêm **service method** → đọc `src/modules/<module>/services/<module>.service.ts`
- Thêm **type/DTO** → đọc `src/modules/<module>/types/index.ts`
- Thêm **form** → đọc 1 form có sẵn (RHF + Zod) trong module hoặc module gần nhất
- Thêm **route mới** → đọc 1 page hiện có cùng group (`src/app/(<group>)/.../page.tsx`) + `src/config/routes.ts`
- Sửa **page** (Scope B) → đọc trực tiếp file page component trong module
- Thêm **nav item** → đọc `src/shared/layouts/AppLayout.tsx`

Không đọc toàn bộ module — chỉ file thật sự liên quan.

---

## STEP 4 — Lập plan trước khi code

In plan ngắn gọn, đầy đủ layers:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [CLIENT] FEATURE PLAN
 Scope    : A (module) / B (page) / C (new route in module)
 Module   : <module-name>
 Target   : <route hoặc page hoặc 'module-level'>
 Feature  : <mô tả>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files to CREATE:
  - <path> — <nội dung>

Files to MODIFY:
  - <path> — <thay đổi>

Layer changes:
  Types:       <new/modified hoặc "none">
  Service:     <new API calls hoặc "none">
  Hooks:       <new TanStack Query hooks hoặc "none">
  Components:  <new/modified hoặc "none">
  Route:       <new route + group hoặc "none">
  Nav item:    <thêm vào AppLayout hoặc "none">
  i18n:        <new keys hoặc "none">
  ROUTES:      <constant mới hoặc "none">
  QUERY_KEYS:  <key mới hoặc "none">

API endpoints cần BE cung cấp:
  | Method | Path | Dùng trong |
  |---|---|---|
  | GET | /... | use<Feature> |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Sau đó hỏi: **"Proceed với implementation?"** — đợi user xác nhận trước khi viết bất kỳ file nào.

---

## STEP 5 — Implement

Sau xác nhận, làm theo đúng plan và tuân thủ rules sau:

### `'use client'` directive
- BẮT BUỘC ở mọi file dùng hooks/event handlers/browser API trong `components/` và `hooks/`
- `services/`, `types/`, `lib/`, `config/` KHÔNG cần
- `app/(...)/page.tsx` là **server component** — chỉ import & render component từ module (không có hooks)

```typescript
// src/app/(app)/dashboard/page.tsx — server component ✓
import { DashboardPage } from '@modules/dashboard'
export default function Page() { return <DashboardPage /> }

// src/modules/dashboard/components/DashboardPage.tsx
'use client'   // ← BẮT BUỘC
```

### Routing (Next.js App Router, KHÔNG react-router-dom)
- Navigation: `useRouter()` từ `next/navigation` → `router.push(...)`
- Link: `<Link href="...">` từ `next/link`
- Active path: `usePathname()` từ `next/navigation`
- Search params: `useSearchParams()` từ `next/navigation`

### Imports
- Luôn dùng path alias: `@modules/*`, `@shared/*`, `@lib/*`, `@store/*`, `@config/*`
- Chỉ import qua `index.ts` của module — không import sâu vào `components/`/`hooks/`

### Types
- Định nghĩa trong `types/index.ts` của module
- Response API dùng `ApiResponse<T>`, list dùng `PaginatedResult<T>` từ `@shared/types`
- Field name khớp BE chính xác

### Service
- Gọi qua `apiClient` từ `@lib/api-client`, **không dùng `fetch` trực tiếp**
- Một function cho một endpoint, đặt tên rõ ràng (`getDashboardStats`, `markAllAsRead`)
- Không có business logic — chỉ là HTTP wrapper

### Hooks (TanStack Query v5)
- `useQuery` cho GET — `queryKey` lấy từ `QUERY_KEYS.<MODULE>.*` trong `src/shared/constants/index.ts`
- `useMutation` cho POST/PATCH/DELETE — `onSuccess` phải `queryClient.invalidateQueries(...)` cho key liên quan
- Toast feedback: `toast.success/error()` từ `sonner`

### Components
- Ưu tiên shadcn/ui từ `@shared/components/ui` — không tự viết HTML/CSS thuần khi đã có sẵn
- Form: React Hook Form + Zod schema validation
- Loading: `<Spinner />` hoặc `<Skeleton />`
- Empty: `<Empty />` component nếu có
- Confirmation dialog cho destructive action
- Mọi text user-facing dùng `useTranslation()` → thêm key vào cả `src/shared/i18n/locales/vi.json` và `en.json`

### Route mới (Scope C)
- Tạo `src/app/(<group>)/<route>/page.tsx` — server component wrap component từ module
- Thêm `ROUTES.<KEY>` vào `src/config/routes.ts`
- Nếu thuộc `(app)` và cần xuất hiện trên sidebar → thêm nav item vào `src/shared/layouts/AppLayout.tsx`
- Nếu page cần auth → đảm bảo nằm trong `(app)`/`(learning)`/`(onboarding)` (đã được `middleware.ts` bảo vệ); nếu public → đặt vào `(public)`

### Middleware / Auth
- Không sửa `src/middleware.ts` trừ khi route mới cần exception rule rõ ràng — discuss với user trước.

---

## STEP 6 — Cập nhật module doc

Sau khi implement, cập nhật `client/.claude/modules/<module-name>.md`:
- Thêm route mới vào bảng **Route** (Scope C)
- Thêm endpoint mới vào bảng **API Endpoints**
- Thêm hook/service/component vào **Public API** nếu được export qua `index.ts`
- Cập nhật section **Structure** nếu có file mới
- Thêm query key mới vào **Query Keys**

---

## STEP 7 — Verify

Chạy type-check:

```bash
cd client && npm run type-check
```

Nếu có lỗi → fix ngay. Nếu là UI feature, nhắc user verify trong trình duyệt (skill này không tự khởi động dev server).

---

## Quality checklist (verify trước khi báo xong)

- [ ] Mọi file mới trong `components/`, `hooks/` có `'use client'`
- [ ] `page.tsx` mới (nếu có) là server component, chỉ import & render
- [ ] Không có relative import `../../` — dùng path alias
- [ ] Service mới gọi qua `apiClient`, không có `fetch` trực tiếp
- [ ] `useQuery` có `queryKey` lấy từ `QUERY_KEYS.<MODULE>.*`
- [ ] `useMutation` có `onSuccess` invalidate cache + toast
- [ ] Loading & empty state được xử lý
- [ ] Text user-facing dùng `useTranslation()`, key có trong cả `vi.json` và `en.json`
- [ ] Route mới có entry trong `src/config/routes.ts`
- [ ] Nav item (nếu có) được thêm vào `AppLayout.tsx`
- [ ] `client/.claude/modules/<module-name>.md` được cập nhật
- [ ] `npm run type-check` pass

---

## Scope guard

Nếu yêu cầu thực chất là một trong các trường hợp sau → dừng & gợi ý skill phù hợp:

- Chỉ đổi text/màu/spacing trong 1 file đã có → `/client-tweak`
- Tạo module hoàn toàn mới (chưa có thư mục dưới `src/modules/`) → `/client-page-from-ui`
- Tạo module mới cho cả BE + FE → `/plan-new-module` rồi `/implement-new-module`
