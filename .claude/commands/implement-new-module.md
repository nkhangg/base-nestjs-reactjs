Thực thi plan từ `/plan-new-module` — tạo toàn bộ module mới từ đầu cho BE và/hoặc FE.
Skill này đọc file plan đã lưu trong `planning/`, load đúng context, rồi implement layer by layer
theo đúng các quy tắc của `be-add-feature` và `fe-add-feature`.

## Arguments

`$ARGUMENTS` — format: `<module-name> [be|fe|both]`

- `both` (default): implement cả BE lẫn FE
- `be`: chỉ implement BE (be-base)
- `fe`: chỉ implement FE (fe-base-admin)

Examples:
- `contacts` — implement cả hai
- `contacts be` — chỉ BE
- `contacts fe` — chỉ FE
- `faq both` — tường minh cả hai

---

## Steps to execute

### STEP 1 — Đọc plan file

Đọc file: `planning/<module-name>.md`

Nếu file không tồn tại → dừng và thông báo:
```
Plan cho module '<module-name>' chưa có.
Hãy chạy: /plan-new-module <module-name> <mô tả>
```

Nếu tồn tại → parse nội dung để extract:
- Danh sách files BE cần CREATE / MODIFY
- Danh sách files FE cần CREATE / MODIFY
- Prisma schema snippet (nếu có)
- Email notification flow (nếu có)
- Spam protection config (nếu có)

---

### STEP 2 — Kiểm tra trạng thái hiện tại

Kiểm tra nhanh:
- `be-base/src/modules/<module-name>/` — đã tồn tại chưa?
- `fe-base-admin/src/modules/<module-name>/` — đã tồn tại chưa?

Nếu một bên đã tồn tại → chỉ implement phần còn lại (bất kể scope argument).
Ghi chú rõ trong output cho user biết.

---

### STEP 3 — Load core context

Dựa trên nội dung plan, đọc các core docs cần thiết:

**BE core docs** (`be-base/.claude/modules/`):

| Plan đề cập | Đọc doc |
|---|---|
| AdminFeature, admin controller, sidebar | `core-admin-shell.md` |
| `@RequirePermission`, seedRoles, RBAC | `core-authorization.md` |
| DomainEvent, EventPublisher, `@OnEvent` | `core-events.md` |
| Queue, BullMQ, Processor, mail queue | `core-queue.md` |
| IntegrationModule, event handler | `core-integration.md` |
| Notification, WebSocket | `notification.md` |

**FE shared docs** (`fe-base-admin/.claude/modules/`):

| Plan đề cập | Đọc doc |
|---|---|
| DataTable, filter, pagination | `shared-ui.md` |
| AdminGuard, permission check | `auth.md` |
| MediaPicker, upload | `media.md` |

Chỉ đọc docs thực sự cần thiết — bỏ qua phần không liên quan đến scope.

---

### STEP 4 — Đọc source files tham chiếu

Đọc source files của một module mẫu gần nhất để hiểu **exact coding pattern**
(không phải để copy — mà để viết đúng convention của codebase này).

Chọn reference module dựa trên domain (ưu tiên: `blog` cho content/CRUD, `user` cho account):

**Nếu implement BE:**
- Đọc 1 entity mẫu: `be-base/src/modules/<ref>/domain/entities/<ref>.entity.ts`
- Đọc 1 use-case mẫu: `be-base/src/modules/<ref>/application/use-cases/create-<ref>.use-case.ts`
- Đọc controller mẫu: `be-base/src/modules/<ref>/presentation/admin/<ref>-admin.controller.ts`
- Đọc Prisma repo mẫu: `be-base/src/modules/<ref>/infrastructure/repositories/prisma-<ref>.repository.ts`

**Nếu implement FE:**
- Đọc service mẫu: `fe-base-admin/src/modules/<ref>/services/<ref>.service.ts`
- Đọc hook mẫu: `fe-base-admin/src/modules/<ref>/hooks/use<Ref>s.ts`
- Đọc component mẫu: `fe-base-admin/src/modules/<ref>/components/<Ref>Page.tsx`

---

### STEP 5 — Print implementation plan & confirm

In tóm tắt những gì sẽ implement, theo format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 IMPLEMENT NEW MODULE: <module-name>
 Scope: <BE / FE / BE + FE>
 Plan:  planning/<module-name>.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files to CREATE (<n> files):
  BE: <count> files
  FE: <count> files

Files to MODIFY (<n> files):
  - <path> — <what>

Prisma: <"schema changes needed" | "no change">
Mail queue: <"yes — extend MailProcessor" | "no">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Sau đó hỏi: **"Proceed with implementation?"** — chờ user xác nhận trước khi viết bất kỳ file nào.

---

### STEP 6 — Implement BE (nếu scope là `be` hoặc `both`)

Implement theo thứ tự layer, tuân theo **đúng các rules của `be-add-feature`**:

#### Layer 1: Domain
- Tạo entity file — zero NestJS/Prisma imports, chỉ relative imports
- Entity methods đặt tên semantic (`markAsRead()`, không phải `setStatus('read')`)
- Tạo repository interface
- Tạo domain event file (nếu plan có)

#### Layer 2: Application
- Mỗi use-case = 1 file, 1 `@Injectable()` class
- Use `Result<T, E>` cho operations có thể fail; plain return cho operations không fail
- Use-cases inject repository interface (không inject Prisma trực tiếp)
- Use-case emit domain event sau khi save thành công (nếu plan yêu cầu)

#### Layer 3: Infrastructure
- `Prisma<Pascal>Repository` — implements interface, dùng mapper
- `InMemory<Pascal>Repository` — Map-based, dùng cho testing, phải implement đúng interface
- `<Module>Mapper` — `toDomain()` và `toPrisma()` methods

#### Layer 4: Presentation
- DTOs với `@ApiProperty()` / `@ApiPropertyOptional()` trên mọi field
- Admin controller: `@UseGuards(AdminAuthGuard)`, `@RequirePermission(resource, action)`
- Public controller (nếu cần): `@Public()`
- Rate-limit decorator (nếu plan có): `@Throttle(...)` trên public routes
- **Static routes TRƯỚC param routes** — bắt buộc
- `AdminFeature` file với `resource`, `permissions`, `menu`

#### Layer 5: Module + wiring
- `<Module>Module` với đủ providers, imports, multi-providers
- `onModuleInit()`: `seedRoles()` dùng upsert (idempotent)
- Seed config mặc định nếu plan yêu cầu (upsert)

#### Layer 6: Modify core files (nếu plan yêu cầu)
- `be-base/src/app.module.ts` — import module mới
- `be-base/src/core/auth/presentation/http/auth.controller.ts` — thêm resource key vào `ADMIN_NAV_RESOURCES`
- `be-base/src/core/queue/queue.constants.ts` — thêm job types mới (nếu plan có mail/queue)
- `be-base/src/core/auth/domain/services/mailer.interface.ts` — thêm method (nếu plan có)
- `be-base/src/core/auth/infrastructure/nodemailer-mailer.service.ts` — implement method (nếu plan có)
- `be-base/src/core/auth/infrastructure/mail.processor.ts` — thêm case (nếu plan có)
- `be-base/src/core/integration/` — thêm event handler (nếu plan có)

#### Sau khi implement BE: Print Prisma note
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PRISMA — thêm vào be-base/prisma/schema.prisma
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<exact schema snippet from plan>

Sau khi sửa schema, chạy:
  npx prisma migrate dev --name <migration-name-from-plan>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### STEP 7 — Implement FE (nếu scope là `fe` hoặc `both`)

Implement theo thứ tự layer, tuân theo **đúng các rules của `fe-add-feature`**:

#### Layer 1: Types
- Tất cả response shapes trong `types/index.ts`
- Dùng `ApiResponse<T>` và `PaginatedResult<T>` từ shared types
- Field names phải match **chính xác** với BE response

#### Layer 2: Service
- 1 function per API endpoint — no business logic
- Gọi `apiClient` từ `lib/api-client/`
- Function names rõ ràng: `listContacts`, `getContact`, `updateContactStatus`, `deleteContact`

#### Layer 3: Hooks
- `useQuery` cho GET — luôn có `queryKey` từ `QUERY_KEYS`
- `useMutation` cho POST/PATCH/DELETE — `invalidateQueries` on success
- `onError` → `toast.error()`, `onSuccess` → `toast.success()`

#### Layer 4: Components
- Dùng shadcn/ui components — không viết HTML/CSS thuần
- Forms: React Hook Form + Zod schema validation
- Loading: `isLoading` / `isPending` từ TanStack Query
- Destructive actions: `ConfirmDialog` (không dùng `window.confirm`)
- Mọi string user-facing: `useTranslation()` — không hardcode

#### Layer 5: Router & Constants
- Lazy loading: `lazy(() => import('./modules/<module>/<Component>'))`
- Thêm vào đúng guard group trong `router.tsx`
- `ROUTES.<MODULE>` vào `src/config/routes.ts`
- `QUERY_KEYS.<MODULE>` vào `src/shared/constants/index.ts`

#### Layer 6: i18n + barrel
- Thêm keys vào `src/shared/i18n/locales/vi.json` và `en.json`
- Tạo `src/modules/<module>/index.ts` export public API

---

### STEP 8 — Tạo module docs

Sau khi implement xong, **bắt buộc** tạo module docs để các skill khác có thể dùng module này:

**BE doc** — tạo `be-base/.claude/modules/<module-name>.md`:
```markdown
# Module: modules/<module-name>

## Mục đích
<1-2 câu từ plan>

## Cấu trúc
<tree của tất cả files đã tạo>

## API Routes
<table của tất cả routes>

## Seeded Roles
<table>

## Domain Events Published
<list nếu có>

## Dependencies
<list modules imported>
```

**FE doc** — tạo `fe-base-admin/.claude/modules/<module-name>.md`:
```markdown
# Module: modules/<module-name>

## Mục đích
<1-2 câu từ plan>

## Cấu trúc
<tree của tất cả files đã tạo>

## Routes
<table>

## API Endpoints
<table>

## Query Keys
<QUERY_KEYS.<MODULE>.*>

## Gotchas
<các edge case quan trọng từ plan>
```

---

### STEP 9 — Print quality checklist

In checklist để user tự verify:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUALITY CHECKLIST — <module-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BE:
 [ ] Domain entity không import NestJS / Prisma
 [ ] InMemory repository implement đúng interface
 [ ] DTO fields có @ApiProperty
 [ ] Static routes trước param routes
 [ ] ADMIN_NAV_RESOURCES cập nhật
 [ ] Prisma migration đã chạy (npx prisma migrate dev)
 [ ] seedRoles() chạy thành công khi start app

FE:
 [ ] Types match BE response chính xác
 [ ] useQuery hooks có đúng queryKey
 [ ] useMutation hooks invalidateQueries on success
 [ ] i18n keys thêm vào vi.json + en.json
 [ ] Route dùng lazy loading
 [ ] QUERY_KEYS và ROUTES constants đã thêm

Docs:
 [ ] be-base/.claude/modules/<module-name>.md tạo xong
 [ ] fe-base-admin/.claude/modules/<module-name>.md tạo xong

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Để thêm feature mới vào module này sau:
  /be-add-feature <module-name> <feature>
  /fe-add-feature <module-name> <feature>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
