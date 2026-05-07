Nhận một UI mẫu (URL, file HTML, ảnh, hoặc mô tả) rồi phân tích → lập plan → implement page/module cho dự án `client/` (Next.js App Router).

## Arguments

`$ARGUMENTS` — một trong các dạng sau:

| Dạng input | Ví dụ |
|---|---|
| URL trang web | `https://example.com/dashboard` |
| Đường dẫn file HTML | `/path/to/mockup.html` |
| Đường dẫn ảnh (PNG/JPG) | `/path/to/screenshot.png` |
| Mô tả kèm route | `flashcard /flashcards` |
| URL + mô tả bổ sung | `https://... trang hiển thị SRS cards` |

Sau khi parse, luôn xác định 2 thứ:
- **UI source**: URL / file path / mô tả văn bản
- **Target route** (nếu đã rõ từ args, nếu không thì suy luận từ UI)

---

## STEP 1 — Load project context

Đọc song song:

1. `client/.claude/CLAUDE.md` — architecture rules, routing, patterns
2. `client/.claude/modules/shared-ui.md` — available components, layouts, hooks

Nếu target module đã tồn tại, đọc thêm `client/.claude/modules/<module>.md`.

---

## STEP 2 — Phân tích UI mẫu

Dựa vào dạng input:

**Nếu là URL:**
- Dùng `WebFetch` để lấy nội dung trang
- Nếu cần xem visual thật sự, dùng `mcp__puppeteer__puppeteer_navigate` + `mcp__puppeteer__puppeteer_screenshot`

**Nếu là file HTML:**
- Dùng `Read` để đọc file

**Nếu là file ảnh (PNG/JPG/WEBP):**
- Dùng `Read` để xem ảnh (Claude là multimodal — sẽ thấy được nội dung ảnh)

**Nếu là mô tả văn bản:**
- Sử dụng trực tiếp, không cần đọc file

Từ UI mẫu, trích xuất:

```
UI Analysis:
  Page title / heading
  Sections / layout regions (header, sidebar, main, cards, table...)
  Interactive elements (forms, buttons, filters, modals...)
  Data displayed (what entities, what fields)
  Navigation / links present
  Loading / empty states (nếu thấy)
  Authentication requirement (public hay protected?)
```

---

## STEP 3 — Map sang client architecture

Dựa vào analysis, xác định:

**Route group:**
| Nếu page... | Thuộc group |
|---|---|
| Public, không cần login (landing, pricing, blog) | `(public)` |
| Auth forms | `(auth)` |
| Full-screen session, không sidebar | `(learning)` |
| Protected, có sidebar | `(app)` |
| Onboarding flow | `(onboarding)` |

**Module name:** tên ngắn gọn, camelCase (vd: `flashcard`, `grammar`, `progress`)

**Module structure cần tạo:**
```
client/src/modules/<module>/
├── components/    # <PageName>Page.tsx, subcomponents
├── hooks/         # use<Feature>.ts
├── services/      # <module>.service.ts
├── types/         # index.ts
└── index.ts
```

**Page file:** `client/src/app/(<group>)/<route>/page.tsx`

---

## STEP 4 — Produce implementation plan

In plan theo format sau (chi tiết, không bỏ sót layer nào):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [CLIENT] PAGE IMPLEMENTATION PLAN
 Module   : <module-name>
 Route    : /<route>  →  src/app/(<group>)/<route>/page.tsx
 UI Input : <loại input + tóm tắt ngắn>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phân tích UI
<Mô tả layout, sections, components, data cần hiển thị>
<Authentication: public / protected>

---

## Files to CREATE

### Module
  - CREATE  client/src/modules/<module>/types/index.ts
            → <interfaces/DTOs cần thiết>
  - CREATE  client/src/modules/<module>/services/<module>.service.ts
            → <API endpoints: METHOD /path>
  - CREATE  client/src/modules/<module>/hooks/use<Feature>.ts
            → <useQuery / useMutation hooks>
  - CREATE  client/src/modules/<module>/components/<PageName>Page.tsx
            → <main page component, 'use client'>
  [- CREATE  client/src/modules/<module>/components/<SubComponent>.tsx
            → <mô tả sub-component nếu có>]
  - CREATE  client/src/modules/<module>/index.ts
            → barrel exports

### Route
  - CREATE  client/src/app/(<group>)/<route>/page.tsx
            → server wrapper, import <PageName>Page

## Files to MODIFY (nếu có)
  - MODIFY  client/src/config/routes.ts
            → thêm ROUTES.<KEY> = '/<route>'
  - MODIFY  client/src/shared/constants/index.ts
            → thêm QUERY_KEYS.<MODULE>.*
  - MODIFY  client/src/shared/i18n/locales/vi.json + en.json
            → thêm keys: <module>.*
  [- MODIFY  client/src/shared/layouts/AppLayout.tsx
            → thêm nav item nếu là protected page]
  [- MODIFY  client/.claude/modules/<module>.md
            → tạo mới hoặc cập nhật doc]

---

## Component breakdown

### <PageName>Page (client component)
Layout:
  <mô tả layout — grid, flex, sections>
State:
  <loading state: skeleton / spinner>
  <empty state: empty component>
  <error state: toast + retry>
Data:
  <hook gọi service nào, trả dữ liệu gì>

[### <SubComponent> (nếu phức tạp)
  <mô tả riêng>]

---

## API Endpoints cần có

| Method | Path | Dùng trong |
|---|---|---|
| GET | /api/... | use<Feature> |
[| POST | /api/... | use<Action> |]

---

## i18n keys mới

vi.json:
  "<module>": {
    "<key>": "<Vietnamese text>"
  }

en.json:
  "<module>": {
    "<key>": "<English text>"
  }

---

## shadcn/ui components sẽ dùng

<Liệt kê components từ @shared/components/ui sẽ dùng>
(tham chiếu từ client/.claude/modules/shared-ui.md)

---

## Effort estimate

| Layer | Effort |
|---|---|
| Types | Low / Medium / High |
| Service | Low / Medium / High |
| Hooks | Low / Medium / High |
| Components | Low / Medium / High |
| **Total** | **Low / Medium / High** |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Sau khi in xong plan, hỏi: **"Proceed với implementation?"** — **đợi user xác nhận** trước khi viết bất kỳ file nào.

---

## STEP 5 — Implement

Sau khi user xác nhận, implement **toàn bộ** theo plan. Tuân thủ các rules sau:

### Rules bắt buộc (client/)

**`'use client'` directive:**
- BẮT BUỘC trên mọi file trong `components/` và `hooks/`
- `services/` và `types/` KHÔNG cần
- `page.tsx` là server component — chỉ import và render component từ module

```typescript
// src/app/(app)/dashboard/page.tsx  ← server component
import { DashboardPage } from '@modules/dashboard'
export default function Page() { return <DashboardPage /> }

// src/modules/dashboard/components/DashboardPage.tsx
'use client'   // ← BẮT BUỘC
```

**Routing (Next.js, không dùng react-router-dom):**
- Navigation: `useRouter()` từ `next/navigation`
- Links: `<Link href="...">` từ `next/link`
- Active path: `usePathname()` từ `next/navigation`
- Search params: `useSearchParams()` từ `next/navigation`

**Import:**
- Luôn dùng path aliases: `@modules/*`, `@shared/*`, `@lib/*`, `@config/*`
- Import qua `index.ts` của module, không import sâu

**State:**
- Server state: `useQuery` / `useMutation` từ TanStack Query
- Forms: `react-hook-form` + `zod`
- Không gọi API trong component — gọi qua `service`, wrap bằng `hook`

**UI:**
- Dùng shadcn/ui từ `@shared/components/ui` — không tự viết lại
- Toast: `toast.success/error()` từ `sonner`
- Loading: `<Spinner />` hoặc `<Skeleton />`
- Empty: `<Empty />` component

**Types:**
- Định nghĩa trong `types/index.ts` của module
- API response dùng `ApiResponse<T>` từ `@shared/types`

---

### Implementation order

1. `types/index.ts` — define interfaces/DTOs
2. `services/<module>.service.ts` — API calls via `apiClient`
3. `hooks/use<Feature>.ts` — TanStack Query wrappers
4. `components/<SubComponents>.tsx` (nếu có) — atomic components
5. `components/<PageName>Page.tsx` — main page
6. `index.ts` — barrel exports
7. `src/app/(<group>)/<route>/page.tsx` — server wrapper
8. `src/config/routes.ts` — thêm ROUTES constant
9. `src/shared/constants/index.ts` — thêm QUERY_KEYS
10. `src/shared/i18n/locales/vi.json` + `en.json` — translations
11. `AppLayout.tsx` nếu thêm nav item
12. `.claude/modules/<module>.md` — tạo/cập nhật doc

---

## STEP 6 — Update module doc

Sau khi implement xong, tạo hoặc cập nhật `client/.claude/modules/<module>.md`:

```markdown
# Module: <module>

<One-line mô tả>

## Structure
[cấu trúc thư mục]

## Public API
[exports từ index.ts]

## Route
[route → page → group]

## API Endpoints
[bảng endpoints]

## Query Keys
[QUERY_KEYS.*]
```

---

## Quality checklist (verify trước khi báo xong)

- [ ] Tất cả component/hook files có `'use client'`
- [ ] `page.tsx` là server component (không có hooks)
- [ ] Không có `../../` relative imports — dùng path aliases
- [ ] API calls qua `apiClient`, không dùng `fetch` trực tiếp
- [ ] `useQuery` có `queryKey` từ `QUERY_KEYS`
- [ ] `useMutation` có `onSuccess` invalidate cache + toast
- [ ] Loading state được xử lý (spinner / skeleton)
- [ ] Empty state được xử lý
- [ ] i18n keys thêm vào cả `vi.json` và `en.json`
- [ ] ROUTES constant được thêm vào `src/config/routes.ts`
- [ ] Module doc được tạo/cập nhật
