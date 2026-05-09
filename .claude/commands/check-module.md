Kiểm tra cấu trúc một module xem có tuân đúng rules kiến trúc của dự án không.
Chạy từng check bằng Glob / Grep, báo cáo kết quả với ✅ ❌ ⚠️, kèm hướng dẫn sửa khi fail.

## Arguments

`$ARGUMENTS` — format: `<module-name> [be|fe|both]`

- `both` (default): check cả BE lẫn FE
- `be`: chỉ check BE (be-base)
- `fe`: chỉ check FE (fe-base-admin)

Examples:
- `contacts`        — check cả hai
- `contacts be`     — chỉ BE
- `blog fe`         — chỉ FE
- `user both`       — tường minh cả hai

---

## Cách thực thi

Parse `$ARGUMENTS`:
- `moduleName` = token đầu
- `scope` = token thứ hai (mặc định `both`)

Dẫn xuất các biến:
- `MODULE_PASCAL` = PascalCase của moduleName (contacts → Contacts, blog-post → BlogPost)
- `BE_MODULE_PATH` = `be-base/src/modules/<moduleName>`
- `FE_MODULE_PATH` = `fe-base-admin/src/modules/<moduleName>`

Chạy **tất cả check** bằng Glob / Grep trước, rồi in toàn bộ report một lần duy nhất ở cuối.
**Không in từng check riêng lẻ trong quá trình chạy.**

---

## Checks cần thực hiện

### ── [BE] Domain Layer ──────────────────────────────────────────

**B-D1** Entity file tồn tại
- Glob: `be-base/src/modules/<moduleName>/domain/entities/<moduleName>.entity.ts`
- ❌ nếu không tồn tại → "Tạo domain entity"

**B-D2** Entity KHÔNG import NestJS hoặc Prisma
- Grep pattern `@nestjs|@prisma/client` trong file entity
- ❌ nếu có match → "Domain layer không được phụ thuộc framework"
- ✅ nếu không có match

**B-D3** Entity extends `BaseEntity` hoặc có cấu trúc entity hợp lệ
- Grep pattern `extends.*Entity|class.*Entity` trong file entity
- ✅ nếu có match | ⚠️ nếu không → "Kiểm tra entity có dùng đúng base class không"

**B-D4** Repository interface file tồn tại
- Glob: `be-base/src/modules/<moduleName>/domain/repositories/<moduleName>.repository.ts`
- ❌ nếu không tồn tại

**B-D5** Repository file export Symbol constant (injection token)
- Grep pattern `Symbol\(` trong file repository interface
- ❌ nếu không có → "Repository cần export Symbol để inject"

**B-D6** Tất cả import trong domain dùng relative path (không dùng path alias `@`)
- Grep pattern `from '@` trong toàn bộ `domain/` folder
- ❌ nếu có match → "Domain layer phải dùng relative imports"

---

### ── [BE] Application Layer ────────────────────────────────────

**B-A1** Có ít nhất 1 use-case file
- Glob: `be-base/src/modules/<moduleName>/application/use-cases/*.use-case.ts`
- ❌ nếu không có file nào

**B-A2** Tất cả use-case có `@Injectable()`
- Grep pattern `@Injectable` trong folder `application/use-cases/`
- ⚠️ nếu số file use-case > số lần xuất hiện @Injectable → "Một số use-case thiếu @Injectable"

**B-A3** Use-case KHÔNG inject `PrismaService` trực tiếp
- Grep pattern `PrismaService` trong folder `application/use-cases/`
- ❌ nếu có match → "Use-case phải inject repository interface, không inject Prisma trực tiếp"

**B-A4** Use-case KHÔNG import NestJS controller / HTTP decorators
- Grep pattern `@Controller|@Get|@Post|@Put|@Patch|@Delete` trong `application/`
- ❌ nếu có match → "Application layer không được dùng HTTP decorators"

---

### ── [BE] Infrastructure Layer ─────────────────────────────────

**B-I1** Prisma repository tồn tại
- Glob: `be-base/src/modules/<moduleName>/infrastructure/repositories/prisma-<moduleName>.repository.ts`
- ❌ nếu không tồn tại

**B-I2** InMemory repository tồn tại
- Glob: `be-base/src/modules/<moduleName>/infrastructure/repositories/in-memory-<moduleName>.repository.ts`
- ❌ nếu không tồn tại → "Cần InMemory repo để test không cần DB"

**B-I3** Cả hai repository đều `implements` interface
- Grep pattern `implements` trong cả 2 file repo
- ❌ nếu một trong hai không có → "Repository phải implements interface, không implement trực tiếp"

**B-I4** Mapper file tồn tại
- Glob: `be-base/src/modules/<moduleName>/infrastructure/mappers/<moduleName>.mapper.ts`
- ❌ nếu không tồn tại

**B-I5** Mapper có cả `toDomain` và `toPrisma` (hoặc `toRecord`) method
- Grep pattern `toDomain` và `toPrisma|toRecord` trong mapper file
- ❌ nếu thiếu một trong hai → "Mapper cần cả 2 chiều: toDomain + toPrisma"

---

### ── [BE] Presentation Layer ────────────────────────────────────

**B-P1** Admin controller tồn tại
- Glob: `be-base/src/modules/<moduleName>/presentation/admin/<moduleName>-admin.controller.ts`
- ❌ nếu không tồn tại

**B-P2** Admin controller dùng `AdminAuthGuard`
- Grep pattern `AdminAuthGuard` trong admin controller
- ❌ nếu không có → "Admin routes phải có @UseGuards(AdminAuthGuard)"

**B-P3** Admin controller dùng `@RequirePermission`
- Grep pattern `RequirePermission` trong admin controller
- ❌ nếu không có → "Mỗi route cần @RequirePermission(resource, action)"

**B-P4** DTOs có `@ApiProperty` / `@ApiPropertyOptional`
- Grep pattern `@ApiProperty` trong folder `presentation/`
- ❌ nếu không có → "DTO fields cần @ApiProperty để sinh Swagger đúng"

**B-P5** AdminFeature file tồn tại
- Glob: `be-base/src/modules/<moduleName>/presentation/admin/<moduleName>-admin.feature.ts`
- ❌ nếu không tồn tại

**B-P6** AdminFeature có `resource`, `permissions`, `menu`
- Grep pattern `resource:` và `permissions:` và `menu:` trong feature file
- ❌ nếu thiếu field nào

**B-P7** ⚠️ Static routes khai báo trước param routes — cần kiểm tra thủ công
- Grep pattern `@Get\(\)|@Delete\(\)|@Patch\(\)` (no param) và `@Get\(':` trong controller
- ⚠️ Luôn flag để remind dev tự kiểm tra thứ tự routes trong controller

---

### ── [BE] Module File ────────────────────────────────────────────

**B-M1** Module file tồn tại
- Glob: `be-base/src/modules/<moduleName>/<moduleName>.module.ts`
- ❌ nếu không tồn tại

**B-M2** Module có `ADMIN_FEATURE` với `multi: true`
- Grep pattern `ADMIN_FEATURE` và `multi: true` trong module file
- ❌ nếu không có → "AdminFeature phải đăng ký với multi: true"

**B-M3** Module có `onModuleInit` với `seedRoles`
- Grep pattern `onModuleInit` và `seedRoles` trong module file
- ❌ nếu không có → "Module phải seed roles idempotent trong onModuleInit"

**B-M4** CONTACT_REPOSITORY (hoặc tên tương đương) được bind tới Prisma repo
- Grep pattern `useClass.*PrismaSource|useClass.*Prisma<module>` hoặc `PrismaContactRepository|Prisma${MODULE_PASCAL}Repository` trong module file
- ❌ nếu không có → "Repository token phải bind vào PrismaRepository"

---

### ── [BE] Core Wiring ────────────────────────────────────────────

**B-W1** `app.module.ts` import module
- Grep pattern `<MODULE_PASCAL>Module` trong `be-base/src/app.module.ts`
- ❌ nếu không có → "Thêm <MODULE_PASCAL>Module vào AppModule imports"

**B-W2** `ADMIN_NAV_RESOURCES` có resource key
- Grep pattern `'<moduleName>'` trong `be-base/src/core/auth/presentation/http/auth.controller.ts`
- ❌ nếu không có → "Thêm resource key vào ADMIN_NAV_RESOURCES"

**B-W3** Module doc tồn tại
- Glob: `be-base/.claude/modules/<moduleName>.md`
- ⚠️ nếu không có → "Tạo module doc để các skill khác có thể reference"

---

### ── [FE] Types Layer ────────────────────────────────────────────

**F-T1** `types/index.ts` tồn tại
- Glob: `fe-base-admin/src/modules/<moduleName>/types/index.ts`
- ❌ nếu không tồn tại

**F-T2** Types KHÔNG dùng `any`
- Grep pattern `: any\b` trong `types/`
- ⚠️ nếu có → "Tránh dùng any — định nghĩa type chính xác"

---

### ── [FE] Service Layer ──────────────────────────────────────────

**F-S1** Service file tồn tại
- Glob: `fe-base-admin/src/modules/<moduleName>/services/<moduleName>.service.ts`
- ❌ nếu không tồn tại

**F-S2** Service dùng `apiClient`
- Grep pattern `apiClient` trong service file
- ❌ nếu không có → "Service phải dùng apiClient, không fetch trực tiếp"

**F-S3** Service KHÔNG chứa React hooks (`useState`, `useEffect`, `useQuery`, ...)
- Grep pattern `useState|useEffect|useQuery|useMutation` trong service file
- ❌ nếu có match → "Business logic và React hooks thuộc hooks/, không phải service"

---

### ── [FE] Hooks Layer ────────────────────────────────────────────

**F-H1** Ít nhất 1 hook file tồn tại
- Glob: `fe-base-admin/src/modules/<moduleName>/hooks/use*.ts`
- ❌ nếu không có

**F-H2** Hooks dùng `QUERY_KEYS`
- Grep pattern `QUERY_KEYS` trong folder `hooks/`
- ❌ nếu không có → "Luôn dùng QUERY_KEYS cho queryKey, không hardcode string"

**F-H3** Mutations có `invalidateQueries` on success
- Grep pattern `invalidateQueries` trong hooks file
- ❌ nếu có mutation (useMutation) nhưng không có invalidateQueries → "Mutation phải invalidate cache on success"

**F-H4** Mutations có toast error handler
- Grep pattern `toast.error` trong hooks file
- ❌ nếu không có → "onError phải toast.error()"

---

### ── [FE] Components Layer ──────────────────────────────────────

**F-C1** Ít nhất 1 component file tồn tại
- Glob: `fe-base-admin/src/modules/<moduleName>/components/*.tsx`
- ❌ nếu không có

**F-C2** Components dùng `useTranslation` (không hardcode string user-facing)
- Grep pattern `useTranslation` trong folder `components/`
- ⚠️ nếu không có → "Dùng useTranslation() cho mọi string hiển thị ra UI"

**F-C3** Destructive action dùng `ConfirmDialog` (không dùng `window.confirm`)
- Grep pattern `window\.confirm` trong folder `components/`
- ❌ nếu có match → "Dùng ConfirmDialog từ @shared/components/ui/confirm-dialog"
- Grep pattern `ConfirmDialog` trong folder `components/`
- ⚠️ nếu không có và có delete action → "Kiểm tra delete có confirm dialog không"

**F-C4** KHÔNG import sâu vào nội bộ module khác (phải qua index.ts)
- Grep pattern `from '@modules/[^']+/(?!index)` trong folder `components/`
- ❌ nếu có match → "Import qua index.ts của module, không import đường dẫn nội bộ"

---

### ── [FE] Wiring & Constants ────────────────────────────────────

**F-W1** Barrel `index.ts` tồn tại
- Glob: `fe-base-admin/src/modules/<moduleName>/index.ts`
- ❌ nếu không tồn tại → "Tạo index.ts export public API của module"

**F-W2** `ROUTES.<MODULE_UPPER>` trong `src/config/routes.ts`
- Grep pattern `<moduleName.toUpperCase()>|<MODULE_UPPER>` (dạng uppercase với underscore) trong `fe-base-admin/src/config/routes.ts`
- ❌ nếu không có

**F-W3** `QUERY_KEYS.<MODULE_UPPER>` trong `src/shared/constants/index.ts`
- Grep pattern `<MODULE_UPPER>:` (dạng uppercase) trong `fe-base-admin/src/shared/constants/index.ts`
- ❌ nếu không có

**F-W4** Lazy import trong `router.tsx`
- Grep pattern `modules/<moduleName>` trong `fe-base-admin/src/app/router.tsx`
- ❌ nếu không có → "Thêm lazy import và route vào router.tsx"

**F-W5** Route entry trong `router.tsx`
- Grep pattern `ROUTES\.\S*<MODULE_UPPER_PARTIAL>` trong router.tsx (kiểm tra ROUTES constant được dùng)
- ❌ nếu không có

**F-W6** Sidebar entry trong `MainLayout.tsx`
- Grep pattern `resource: '<moduleName>'` trong `fe-base-admin/src/shared/layouts/MainLayout.tsx`
- ⚠️ nếu không có → "Module có admin feature nhưng chưa có mục trong sidebar"

**F-W7** i18n key trong `vi.json`
- Grep pattern `"<moduleName>":` trong `fe-base-admin/src/shared/i18n/locales/vi.json`
- ❌ nếu không có

**F-W8** i18n key trong `en.json`
- Grep pattern `"<moduleName>":` trong `fe-base-admin/src/shared/i18n/locales/en.json`
- ❌ nếu không có

**F-W9** Module doc tồn tại
- Glob: `fe-base-admin/.claude/modules/<moduleName>.md`
- ⚠️ nếu không có → "Tạo module doc để các skill khác có thể reference"

---

## Format output

Sau khi chạy tất cả checks, in report theo format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MODULE CHECK: <module-name>
 Scope : <BE / FE / BE + FE>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[BE] be-base/src/modules/<module>/
─────────────────────────────────────────────────────────
 Domain
  ✅/❌/⚠️  B-D1  Entity file tồn tại
  ✅/❌/⚠️  B-D2  Entity không import NestJS/Prisma
  ✅/❌/⚠️  B-D3  Entity extends BaseEntity
  ✅/❌/⚠️  B-D4  Repository interface tồn tại
  ✅/❌/⚠️  B-D5  Repository export Symbol token
  ✅/❌/⚠️  B-D6  Domain dùng relative imports

 Application
  ✅/❌/⚠️  B-A1  Có use-case files
  ✅/❌/⚠️  B-A2  Use-cases có @Injectable()
  ✅/❌/⚠️  B-A3  Use-cases không inject Prisma trực tiếp
  ✅/❌/⚠️  B-A4  Application không dùng HTTP decorators

 Infrastructure
  ✅/❌/⚠️  B-I1  Prisma repository tồn tại
  ✅/❌/⚠️  B-I2  InMemory repository tồn tại
  ✅/❌/⚠️  B-I3  Cả hai repo implements interface
  ✅/❌/⚠️  B-I4  Mapper file tồn tại
  ✅/❌/⚠️  B-I5  Mapper có toDomain + toPrisma

 Presentation
  ✅/❌/⚠️  B-P1  Admin controller tồn tại
  ✅/❌/⚠️  B-P2  Admin controller dùng AdminAuthGuard
  ✅/❌/⚠️  B-P3  Admin controller dùng @RequirePermission
  ✅/❌/⚠️  B-P4  DTOs có @ApiProperty
  ✅/❌/⚠️  B-P5  AdminFeature file tồn tại
  ✅/❌/⚠️  B-P6  AdminFeature có resource + permissions + menu
  ⚠️        B-P7  Static routes trước param routes — kiểm tra thủ công

 Module
  ✅/❌/⚠️  B-M1  Module file tồn tại
  ✅/❌/⚠️  B-M2  ADMIN_FEATURE với multi: true
  ✅/❌/⚠️  B-M3  onModuleInit có seedRoles
  ✅/❌/⚠️  B-M4  Repository token bind vào Prisma repo

 Core Wiring
  ✅/❌/⚠️  B-W1  AppModule imports module
  ✅/❌/⚠️  B-W2  ADMIN_NAV_RESOURCES có resource key
  ✅/❌/⚠️  B-W3  Module doc tồn tại

[FE] fe-base-admin/src/modules/<module>/
─────────────────────────────────────────────────────────
 Types
  ✅/❌/⚠️  F-T1  types/index.ts tồn tại
  ✅/❌/⚠️  F-T2  Không dùng any

 Service
  ✅/❌/⚠️  F-S1  Service file tồn tại
  ✅/❌/⚠️  F-S2  Service dùng apiClient
  ✅/❌/⚠️  F-S3  Service không chứa React hooks

 Hooks
  ✅/❌/⚠️  F-H1  Có hook files
  ✅/❌/⚠️  F-H2  Hooks dùng QUERY_KEYS
  ✅/❌/⚠️  F-H3  Mutations có invalidateQueries
  ✅/❌/⚠️  F-H4  Mutations có toast.error

 Components
  ✅/❌/⚠️  F-C1  Có component files
  ✅/❌/⚠️  F-C2  Dùng useTranslation
  ✅/❌/⚠️  F-C3  Không dùng window.confirm
  ✅/❌/⚠️  F-C4  Không import sâu vào nội bộ module khác

 Wiring & Constants
  ✅/❌/⚠️  F-W1  Barrel index.ts tồn tại
  ✅/❌/⚠️  F-W2  ROUTES constant tồn tại
  ✅/❌/⚠️  F-W3  QUERY_KEYS constant tồn tại
  ✅/❌/⚠️  F-W4  Lazy import trong router.tsx
  ✅/❌/⚠️  F-W5  Route entry trong router.tsx
  ✅/❌/⚠️  F-W6  Sidebar entry trong MainLayout.tsx
  ✅/❌/⚠️  F-W7  i18n key trong vi.json
  ✅/❌/⚠️  F-W8  i18n key trong en.json
  ✅/❌/⚠️  F-W9  Module doc tồn tại

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Kết quả: <N> ✅ passed · <N> ❌ failed · <N> ⚠️ cần xem lại
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Lỗi cần sửa:
  ❌ B-Dx — <mô tả ngắn gọn vấn đề và cách sửa>
  ❌ F-Wx — <mô tả ngắn gọn vấn đề và cách sửa>

Cần xem lại thủ công:
  ⚠️ B-P7 — Kiểm tra thứ tự routes trong controller: static routes (@Get(), @Delete()) phải trước param routes (@Get(':id'))
  ⚠️ ...
```

Nếu module không tồn tại ở một phía (BE hoặc FE) → bỏ qua các check của phía đó và ghi rõ:
`⏭️ Không tìm thấy be-base/src/modules/<moduleName>/ — bỏ qua BE checks`

Nếu tất cả checks đều pass → in thêm:
`🎉 Module <name> tuân đúng kiến trúc dự án.`
