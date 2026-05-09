Lập kế hoạch tạo một **module hoàn toàn mới** cho cả BE (be-base) lẫn FE (fe-base-admin). Skill này dành riêng cho module chưa tồn tại — nếu module đã có, hãy dùng `/be-plan-feature` hoặc `/fe-plan-feature`.

## Arguments

`$ARGUMENTS` — format: `<module-name> <mô tả domain / mục đích module>`

Examples:
- `contacts Module quản lý form liên hệ từ người dùng gửi lên`
- `faq Module câu hỏi thường gặp có admin CRUD và public list`
- `coupon Module mã giảm giá với CRUD admin và public validate`
- `report Module báo cáo thống kê tổng hợp theo ngày/tuần/tháng`

Parse:
- First token = **module name** (snake_case or kebab-case, sẽ dùng cho file/folder)
- Rest = **mô tả domain** bằng ngôn ngữ tự nhiên

---

## Steps to execute

### STEP 1 — Kiểm tra module chưa tồn tại

Kiểm tra cả hai nơi:
- `be-base/src/modules/<module-name>/` — nếu tồn tại → cảnh báo user, gợi ý dùng `/be-plan-feature`
- `fe-base-admin/src/modules/<module-name>/` — nếu tồn tại → cảnh báo user, gợi ý dùng `/fe-plan-feature`

Nếu **cả hai đã tồn tại** → báo lỗi và stop.
Nếu **một bên đã tồn tại** → ghi chú trong plan và chỉ plan phần còn thiếu.

---

### STEP 2 — Detect core dependencies cần đọc

Dựa trên mô tả module, xác định core docs nào cần load:

**BE core docs** (tất cả trong `be-base/.claude/modules/`):

| Module liên quan đến | Đọc doc |
|---|---|
| Auth, guard, JWT, session | `core-auth.md` |
| Permissions, roles, `@RequirePermission` | `core-authorization.md` |
| Admin panel, AdminFeature, sidebar | `core-admin-shell.md` |
| Domain events, publish/subscribe | `core-events.md` |
| Background jobs, queue, BullMQ | `core-queue.md` |
| Push notification, WebSocket | `notification.md` |
| Event → queue → notification flow | `core-integration.md` |

**FE shared docs** (trong `fe-base-admin/.claude/modules/`):

| Module liên quan đến | Đọc doc |
|---|---|
| Route guard, auth check, permission | `auth.md` |
| Table, DataTable, pagination, filter | `shared-ui.md` |
| Upload, media picker | `media.md` |
| WebSocket, real-time notification | `notification.md` |

Chỉ đọc những doc thực sự cần thiết.

---

### STEP 3 — Đọc một module mẫu làm tham chiếu

Chọn module mẫu gần nhất về domain (ưu tiên: `blog` cho content, `user` cho account, `config` cho key-value, `merchant` cho B2B):

- Đọc `be-base/.claude/modules/<reference-module>.md`
- Đọc `fe-base-admin/.claude/modules/<reference-module>.md`

Mục đích: hiểu pattern file naming, structure, convention — không copy code.

---

### STEP 4 — Produce implementation plan

In toàn bộ plan theo format sau:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 NEW MODULE PLAN
 Module  : <module-name>
 Domain  : <mô tả ngắn gọn domain>
 Scope   : BE (be-base) + FE (fe-base-admin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tóm tắt
<3–4 câu mô tả module làm gì, ai dùng (admin/user/public), các entity chính,
và flow cốt lõi của module>

---

## ━━ BACKEND (be-base) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Domain layer
<Mô tả entity chính, các field, trạng thái (status enum nếu có),
repo interface methods cần thiết, domain events nếu cần emit>

Files to CREATE:
  - be-base/src/modules/<module>/domain/entities/<module>.entity.ts
        — <danh sách field chính: id, field1, field2, status?, createdAt>
  - be-base/src/modules/<module>/domain/repositories/<module>.repository.ts
        — <interface với các method: findById, findAll, save, delete, ...>
  (thêm các file domain khác nếu cần: value objects, domain events)

### Application layer
<Mô tả các use-case cần thiết, logic chính mỗi use-case>

Files to CREATE:
  - be-base/src/modules/<module>/application/use-cases/create-<module>.use-case.ts   — <mô tả>
  - be-base/src/modules/<module>/application/use-cases/list-<module>s.use-case.ts    — <mô tả>
  - be-base/src/modules/<module>/application/use-cases/get-<module>.use-case.ts      — <mô tả>
  - be-base/src/modules/<module>/application/use-cases/update-<module>.use-case.ts   — <mô tả>
  - be-base/src/modules/<module>/application/use-cases/delete-<module>.use-case.ts   — <mô tả>
  (thêm hoặc bỏ bớt use-case tùy domain)

### Infrastructure layer
<Mô tả Prisma repo, in-memory repo, mapper>

Files to CREATE:
  - be-base/src/modules/<module>/infrastructure/repositories/prisma-<module>.repository.ts
        — implements <Module>Repository, dùng PrismaService
  - be-base/src/modules/<module>/infrastructure/repositories/in-memory-<module>.repository.ts
        — dùng cho testing
  - be-base/src/modules/<module>/infrastructure/mappers/<module>.mapper.ts
        — chuyển đổi Prisma model ↔ domain entity

### Presentation layer
<Mô tả controller, route groups, DTOs>

Files to CREATE:
  - be-base/src/modules/<module>/presentation/admin/<module>-admin.controller.ts
        — AdminAuthGuard, các route CRUD admin
  - be-base/src/modules/<module>/presentation/admin/<module>-admin.feature.ts
        — AdminFeature config (resource key, menu)
  - be-base/src/modules/<module>/presentation/public/<module>-public.controller.ts
        — @Public(), các route cho user/guest (nếu cần)
  - be-base/src/modules/<module>/presentation/dtos/
        — CreateDto, UpdateDto, ResponseDto (với @ApiProperty)

Files to MODIFY:
  - be-base/src/app.module.ts   — import <Module>Module vào AppModule
  - be-base/src/core/auth/presentation/http/auth.controller.ts
        — thêm '<module-resource-key>' vào ADMIN_NAV_RESOURCES (nếu có admin nav item)

### Module file
Files to CREATE:
  - be-base/src/modules/<module>/<module>.module.ts
        — providers, bindings (REPOSITORY token), imports (EventsModule nếu cần)

---

## API Routes (BE)

### Admin (`/admin/<module>`)
| Method | Path | Use-case | Permission |
|---|---|---|---|
| GET | `/admin/<module>` | List<Module>sUseCase | read |
| POST | `/admin/<module>` | Create<Module>UseCase | create |
| GET | `/admin/<module>/:id` | Get<Module>UseCase | read |
| PATCH | `/admin/<module>/:id` | Update<Module>UseCase | update |
| DELETE | `/admin/<module>/:id` | Delete<Module>UseCase | delete |
(thêm/bỏ route tùy domain)

### Public (`/<module>`) — nếu cần
| Method | Path | Mô tả |
|---|---|---|
| GET | `/<module>` | Public list (nếu có) |
| POST | `/<module>` | Submit từ user/guest (nếu có) |

---

## Prisma schema (BE)

```prisma
model <PascalModule> {
  id          String   @id @default(cuid())
  <field1>    <type>
  <field2>    <type>
  status      <Status>?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("<module>s")
}

enum <Status> {
  <VALUE1>
  <VALUE2>
}
```

Migration name: `add-<module>-module`

---

## ━━ FRONTEND (fe-base-admin) ━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Types
Files to CREATE:
  - fe-base-admin/src/modules/<module>/types/index.ts
        — <Module>, <Module>Status (nếu có enum), Create<Module>Dto, Update<Module>Dto

### Service
Files to CREATE:
  - fe-base-admin/src/modules/<module>/services/<module>.service.ts
        — list<Module>s, get<Module>, create<Module>, update<Module>, delete<Module>

### Hooks
Files to CREATE:
  - fe-base-admin/src/modules/<module>/hooks/use<Module>s.ts
        — use<Module>List, use<Module>, useCreate<Module>, useUpdate<Module>, useDelete<Module>

### Components
Files to CREATE:
  - fe-base-admin/src/modules/<module>/components/<Module>Page.tsx
        — trang list chính với DataTable
  - fe-base-admin/src/modules/<module>/components/<Module>Modal.tsx
        — modal create/edit
  (thêm component khác nếu domain phức tạp)

### Router & Navigation
Files to MODIFY:
  - fe-base-admin/src/app/router.tsx
        — thêm lazy route `/<module>` vào AdminGuard group
  - fe-base-admin/src/config/routes.ts
        — thêm `ROUTES.<MODULE>: '/<module>'`
  - fe-base-admin/src/shared/constants/index.ts
        — thêm `QUERY_KEYS.<MODULE>: { LIST, DETAIL }`

### Module barrel
Files to CREATE:
  - fe-base-admin/src/modules/<module>/index.ts   — export public API

### i18n
Thêm vào `fe-base-admin/src/shared/i18n/locales/vi.json` và `en.json`:
```json
"<module>": {
  "title": "<Tên module>",
  "create": "Tạo mới",
  "edit": "Chỉnh sửa",
  "delete": "Xóa",
  "deleteConfirm": "Bạn có chắc muốn xóa?",
  "status": {
    "<value1>": "<label vi>",
    "<value2>": "<label vi>"
  }
}
```

---

## UX notes (FE)
- Loading state: skeleton/spinner trong DataTable khi `isLoading`
- Error state: `toast.error()` từ Sonner khi API fail
- Empty state: thông báo "Chưa có dữ liệu" trong DataTable
- Destructive actions: `ConfirmDialog` từ `@shared/components/ui/confirm-dialog`
- <thêm UX note đặc thù nếu domain phức tạp>

---

## Module docs cần tạo sau khi implement

Files to CREATE:
  - be-base/.claude/modules/<module>.md   — cấu trúc BE, routes, events
  - fe-base-admin/.claude/modules/<module>.md   — cấu trúc FE, routes, API endpoints

---

## Edge cases & risks
- <edge case hoặc risk cụ thể 1>
- <edge case hoặc risk cụ thể 2>
- <thêm tối thiểu 2, chỉ ghi risk thực sự — không ghi vấn đề hiển nhiên>

---

## Effort estimate
| Phần | Layer | Effort |
|---|---|---|
| BE | Domain | Low / Medium / High |
| BE | Application | Low / Medium / High |
| BE | Infrastructure | Low / Medium / High |
| BE | Presentation | Low / Medium / High |
| FE | Types + Service | Low / Medium / High |
| FE | Hooks | Low / Medium / High |
| FE | Components | Low / Medium / High |
| FE | Router + i18n | Low / Medium / High |
| **Tổng** | | **Low / Medium / High** |

---

## Checklist khi implement

### BE checklist
- [ ] Entity không import NestJS / Prisma
- [ ] Tất cả import trong domain layer dùng relative path
- [ ] Repository interface có đầy đủ method cần thiết
- [ ] InMemory repository implement đúng interface
- [ ] Prisma repository implement đúng interface + dùng mapper
- [ ] DTO fields đều có `@ApiProperty` / `@ApiPropertyOptional`
- [ ] Admin routes có `@RequirePermission(...)` decorator
- [ ] Static routes khai báo TRƯỚC param routes trong controller
- [ ] `ADMIN_NAV_RESOURCES` trong auth.controller.ts được cập nhật (nếu có nav item)
- [ ] Module được import vào `AppModule`
- [ ] `seedRoles()` trong `onModuleInit` dùng `upsert` — idempotent
- [ ] Prisma schema thêm đúng model + migration chạy thành công

### FE checklist
- [ ] Types match BE response fields chính xác
- [ ] Service function riêng cho mỗi API endpoint
- [ ] `useQuery` hooks có đúng `queryKey` từ `QUERY_KEYS`
- [ ] `useMutation` hooks gọi `invalidateQueries` on success
- [ ] Toast success và error cho mọi mutation
- [ ] Tất cả string user-facing dùng `useTranslation()` — keys thêm vào vi.json + en.json
- [ ] Form dùng React Hook Form + Zod validation
- [ ] Destructive actions có `ConfirmDialog` confirm
- [ ] Route dùng lazy loading và được thêm vào `router.tsx`
- [ ] `ROUTES` constant được thêm vào `src/config/routes.ts`
- [ ] `QUERY_KEYS` được thêm vào `src/shared/constants/index.ts`
- [ ] Module export qua `index.ts`

### Sau khi implement
- [ ] be-base/.claude/modules/<module>.md — tạo module doc
- [ ] fe-base-admin/.claude/modules/<module>.md — tạo module doc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Để implement theo plan này:
  BE: /be-add-feature <module-name> <mô tả>
  FE: /fe-add-feature <module-name> <mô tả>
  (hoặc yêu cầu implement trực tiếp trong chat)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### STEP 5 — Lưu plan vào folder planning

Sau khi in plan ra màn hình, **bắt buộc** lưu plan thành file:

```
planning/<module-name>.md
```

Format file lưu:
- Header: `# NEW MODULE PLAN — <module-name> (<tên tiếng Việt>)`
- Dòng thứ hai: `> **Ngày:** <ngày hôm nay theo định dạng DD/MM/YYYY>`
- Toàn bộ nội dung plan (không có dấu ━ decoration, dùng Markdown thuần)

Sau khi lưu, thông báo cho user:
```
Plan đã được lưu tại: planning/<module-name>.md
```

Do NOT implement anything. Stop after saving the plan file.
