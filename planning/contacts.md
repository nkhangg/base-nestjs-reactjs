# NEW MODULE PLAN — contacts (Liên hệ / Contact Us)
> **Ngày:** 09/05/2026

---

## Tóm tắt
Module contacts cho phép guest/user gửi form liên hệ qua public endpoint mà không cần đăng nhập.
Admin có thể xem danh sách, xem chi tiết, cập nhật trạng thái (PENDING → READ → RESPONDED → CLOSED),
thêm ghi chú nội bộ và xóa liên hệ. Không có luồng tạo mới từ phía admin.
Khi có contact mới, hệ thống tự động gửi email thông báo đến admin qua mail queue (BullMQ) —
tận dụng infrastructure `QUEUE_NAMES.MAIL` + `MailProcessor` đã có sẵn trong auth module.

---

## ━━ BACKEND (be-base) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Domain layer
Entity `Contact` gồm thông tin người gửi (firstName, lastName, email, phone), nội dung (subject, message),
trạng thái quản lý (status enum: PENDING/READ/RESPONDED/CLOSED), ghi chú admin (note),
và thời điểm phản hồi (respondedAt). Repository interface hỗ trợ pagination + filter theo status.

Files:
- CREATE `be-base/src/modules/contacts/domain/entities/contact.entity.ts`
  — fields: id, firstName, lastName, email, phone?, subject, message, status (ContactStatus),
    note?, respondedAt?, createdAt, updatedAt
  — computed getter: fullName() → `${firstName} ${lastName}`
  — methods: markAsRead(), markAsResponded(), markAsClosed(), updateNote(note)
- CREATE `be-base/src/modules/contacts/domain/repositories/contact.repository.ts`
  — interface ContactRepository: findById, findAll(page, limit, statusFilter, search), count(statusFilter), save, delete
- CREATE `be-base/src/modules/contacts/domain/events/contact-submitted.event.ts`
  — ContactSubmittedEvent { contactId, firstName, lastName, email, subject }

---

### Application layer

Files:
- CREATE `be-base/src/modules/contacts/application/use-cases/submit-contact.use-case.ts`
  — Tạo mới Contact với status=PENDING, emit ContactSubmittedEvent sau khi save thành công
- CREATE `be-base/src/modules/contacts/application/use-cases/list-contacts.use-case.ts`
  — Trả về paginated list, filter theo status, search theo name/email/subject
- CREATE `be-base/src/modules/contacts/application/use-cases/get-contact.use-case.ts`
  — Tìm theo id, trả Result<Contact, 'not_found'>
- CREATE `be-base/src/modules/contacts/application/use-cases/update-contact-status.use-case.ts`
  — Cập nhật status + note, set respondedAt nếu status=RESPONDED, trả Result<Contact, 'not_found'>
- CREATE `be-base/src/modules/contacts/application/use-cases/delete-contact.use-case.ts`
  — Xóa theo id, trả Result<void, 'not_found'>

---

### Infrastructure layer

Files:
- CREATE `be-base/src/modules/contacts/infrastructure/repositories/prisma-contact.repository.ts`
  — implements ContactRepository, dùng PrismaService + ContactMapper
  — `findAll` build where clause theo status filter, search trên name/email/subject
- CREATE `be-base/src/modules/contacts/infrastructure/repositories/in-memory-contact.repository.ts`
  — Map-based, dùng cho testing
- CREATE `be-base/src/modules/contacts/infrastructure/mappers/contact.mapper.ts`
  — toDomain(prisma): Contact, toPrisma(entity): PrismaContactCreateInput

---

### Presentation layer

Files:
- CREATE `be-base/src/modules/contacts/presentation/public/contacts-public.controller.ts`
  — @Public(), POST /contacts với SubmitContactDto
  — @Throttle({ default: { limit: 3, ttl: 60_000 } }) override global limit → tối đa 3 submit/phút/IP
- CREATE `be-base/src/modules/contacts/presentation/admin/contacts-admin.controller.ts`
  — @UseGuards(AdminAuthGuard), các route admin với @RequirePermission
- CREATE `be-base/src/modules/contacts/presentation/admin/contacts-admin.feature.ts`
  — resource: 'contacts', permissions: ['read','update','delete'],
    menu: { label: 'Liên hệ', icon: 'mail', order: 8 }
- CREATE `be-base/src/modules/contacts/presentation/dtos/submit-contact.dto.ts`
  — name (string), email (IsEmail), phone? (string), subject (string), message (string, maxLength:5000)
  — honeypot: website? (@IsOptional, @IsEmpty) — field ẩn, bot điền vào → BE trả 400
- CREATE `be-base/src/modules/contacts/presentation/dtos/update-contact-status.dto.ts`
  — status (ContactStatus enum), note? (string)
- CREATE `be-base/src/modules/contacts/presentation/dtos/contact-response.dto.ts`
  — tất cả fields + @ApiProperty

Files to MODIFY:
- MODIFY `be-base/src/app.module.ts` — import ContactsModule
- MODIFY `be-base/src/core/auth/presentation/http/auth.controller.ts`
  — thêm 'contacts' vào ADMIN_NAV_RESOURCES

### Module file
- CREATE `be-base/src/modules/contacts/contacts.module.ts`
  — providers: [5 use-cases, { provide: CONTACT_REPOSITORY, useClass: PrismaContactRepository },
    { provide: ADMIN_FEATURE, useValue: ContactsAdminFeature, multi: true }]
  — imports: [EventsModule] — để SubmitContactUseCase có thể inject DOMAIN_EVENT_BUS
  — imports: [ConfigModule] — để IntegrationModule có thể dùng GetConfigByKeyUseCase (hoặc import ở IntegrationModule)
  — onModuleInit: seedRoles(['contact-manager', 'contact-viewer'])

---

## API Routes (BE)

### Public (`/contacts`)
| Method | Path | Use-case | Auth |
|---|---|---|---|
| POST | `/contacts` | SubmitContactUseCase | @Public() |

### Admin (`/admin/contacts`)
| Method | Path | Use-case | Permission |
|---|---|---|---|
| GET | `/admin/contacts` | ListContactsUseCase | contacts:read |
| GET | `/admin/contacts/:id` | GetContactUseCase | contacts:read |
| PATCH | `/admin/contacts/:id` | UpdateContactStatusUseCase | contacts:update |
| DELETE | `/admin/contacts/:id` | DeleteContactUseCase | contacts:delete |

### Seeded Roles
| Role | SubjectType | Permissions |
|---|---|---|
| contact-manager | admin | contacts → read, update, delete |
| contact-viewer  | admin | contacts → read |

---

## Prisma schema

```prisma
model Contact {
  id          String        @id @default(cuid())
  firstName   String        @map("first_name")
  lastName    String        @map("last_name")
  email       String
  phone       String?
  subject     String
  message     String        @db.Text
  status      ContactStatus @default(PENDING)
  note        String?
  respondedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("contacts")
}

enum ContactStatus {
  PENDING
  READ
  RESPONDED
  CLOSED
}
```

Migration name: `add-contacts-module`

---

## ━━ FRONTEND (fe-base-admin) ━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Types
- CREATE `fe-base-admin/src/modules/contacts/types/index.ts`
  — ContactStatus ('PENDING' | 'READ' | 'RESPONDED' | 'CLOSED')
  — Contact { id, firstName, lastName, email, phone?, subject, message, status, note?, respondedAt?, createdAt, updatedAt }
  — UpdateContactStatusDto { status: ContactStatus, note?: string }

### Service
- CREATE `fe-base-admin/src/modules/contacts/services/contacts.service.ts`
  — listContacts(params): PaginatedResult<Contact>   → GET /admin/contacts
  — getContact(id): Contact                           → GET /admin/contacts/:id
  — updateContactStatus(id, dto): Contact             → PATCH /admin/contacts/:id
  — deleteContact(id): void                           → DELETE /admin/contacts/:id

### Hooks
- CREATE `fe-base-admin/src/modules/contacts/hooks/useContacts.ts`
  — useContactList(params) — useQuery, QUERY_KEYS.CONTACTS.LIST
  — useContact(id)         — useQuery, QUERY_KEYS.CONTACTS.DETAIL
  — useUpdateContactStatus() — useMutation, invalidate LIST + DETAIL on success
  — useDeleteContact()       — useMutation, invalidate LIST on success

### Components
- CREATE `fe-base-admin/src/modules/contacts/components/ContactsPage.tsx`
  — DataTable server-side: columns firstName + lastName (gộp hiển thị), email, subject, status (Badge), createdAt
  — Filter: status (select), search (firstName/lastName/email/subject)
  — Row action: mở ContactDetailDialog
- CREATE `fe-base-admin/src/modules/contacts/components/ContactDetailDialog.tsx`
  — Dialog hiển thị full message + thông tin người gửi
  — Form: Select status + Textarea note → useUpdateContactStatus
  — Nút Xóa → ConfirmDialog → useDeleteContact → đóng dialog

#### Status Badge mapping
| Status | Badge variant |
|---|---|
| PENDING | warning (vàng) |
| READ | secondary (xám) |
| RESPONDED | info (xanh dương) |
| CLOSED | default (xanh lá) |

### Router & Navigation
- MODIFY `fe-base-admin/src/app/router.tsx` — lazy route /contacts → ContactsPage (AdminGuard group)
- MODIFY `fe-base-admin/src/config/routes.ts` — ROUTES.CONTACTS: '/contacts'
- MODIFY `fe-base-admin/src/shared/constants/index.ts`
  — QUERY_KEYS.CONTACTS: { LIST: ['contacts', 'list'], DETAIL: ['contacts', 'detail'] }

### Module barrel
- CREATE `fe-base-admin/src/modules/contacts/index.ts` — export { ContactsPage }

### i18n
```json
// vi.json & en.json — thêm key "contacts"
{
  "contacts": {
    "title": "Liên hệ",
    "delete": "Xóa liên hệ",
    "deleteConfirm": "Bạn có chắc muốn xóa liên hệ này?",
    "updateStatus": "Cập nhật trạng thái",
    "note": "Ghi chú nội bộ",
    "fields": {
      "firstName": "Tên", "lastName": "Họ", "email": "Email", "phone": "Điện thoại",
      "subject": "Chủ đề", "message": "Nội dung",
      "status": "Trạng thái", "respondedAt": "Đã phản hồi lúc"
    },
    "status": {
      "PENDING": "Chờ xử lý", "READ": "Đã đọc",
      "RESPONDED": "Đã phản hồi", "CLOSED": "Đã đóng"
    }
  }
}
```

---

## UX notes (FE)
- Loading: skeleton rows trong DataTable khi `isLoading`
- Empty state: "Chưa có liên hệ nào" với icon mail
- Destructive: `ConfirmDialog` trước khi xóa
- Khi update status thành công → `toast.success('Đã cập nhật trạng thái')`
- ContactDetailDialog tự động set READ khi admin mở contact có status=PENDING
  (useEffect gọi updateContactStatus 1 lần — cẩn thận React 18 strict mode double-invoke)

---

## Module docs cần tạo sau khi implement
- CREATE `be-base/.claude/modules/contacts.md`
- CREATE `fe-base-admin/.claude/modules/contacts.md`

---

## Email Notification Flow

Khi có contact mới, hệ thống gửi email thông báo đến các admin email được lưu trong config.

### Config key
| prefix | key | value type | ví dụ |
|---|---|---|---|
| `system` | `mails` | JSON array of strings | `["admin@example.com", "support@example.com"]` |

Full key trong AppConfig: **`system.mails`**

### Flow
```
SubmitContactUseCase
  → save Contact (status=PENDING)
  → emit ContactSubmittedEvent { contactId, firstName, lastName, email, subject }
       ↓
IntegrationModule — @OnEvent('contact.submitted')
  → GetConfigByKeyUseCase.execute('system.mails')
  → parse value as string[]  (nếu key không tồn tại / rỗng → skip, không throw)
  → for each adminEmail: mailQueue.add(MAIL_JOBS.SEND_CONTACT_NOTIFICATION, { to, contact })
       ↓
MailProcessor — case MAIL_JOBS.SEND_CONTACT_NOTIFICATION
  → NodemailerMailerService.sendContactNotificationEmail({ to, firstName, lastName, email, subject })
```

### Files cần thay đổi / tạo mới

**Domain:**
- CREATE `be-base/src/modules/contacts/domain/events/contact-submitted.event.ts`
  — `class ContactSubmittedEvent { contactId, firstName, lastName, email, subject }`

**Application:**
- MODIFY `be-base/src/modules/contacts/application/use-cases/submit-contact.use-case.ts`
  — inject `@Inject(DOMAIN_EVENT_BUS) private events: IDomainEventBus`
  — sau khi save: `await this.events.publish(new ContactSubmittedEvent(...))`

**Core — queue constants:**
- MODIFY `be-base/src/core/queue/queue.constants.ts`
  — thêm `MAIL_JOBS.SEND_CONTACT_NOTIFICATION: 'send-contact-notification'`
  — thêm interface `SendContactNotificationJobData { to: string; firstName: string; lastName: string; email: string; subject: string }`

**Core — mail processor:**
- MODIFY `be-base/src/core/auth/infrastructure/mail.processor.ts`
  — thêm case `MAIL_JOBS.SEND_CONTACT_NOTIFICATION` → gọi `mailerService.sendContactNotificationEmail(...)`

**Core — mailer interface & implementation:**
- MODIFY `be-base/src/core/auth/domain/services/mailer.interface.ts`
  — thêm method `sendContactNotificationEmail(params): Promise<void>`
- MODIFY `be-base/src/core/auth/infrastructure/nodemailer-mailer.service.ts`
  — implement `sendContactNotificationEmail` — gửi email với subject "Liên hệ mới: {subject}"

**Core — integration:**
- MODIFY `be-base/src/core/integration/integration.module.ts` (hoặc handler file riêng)
  — thêm `@OnEvent('contact.submitted')` handler
  — inject `GetConfigByKeyUseCase` (ConfigModule phải export use-case này — đã export sẵn)
  — inject `@InjectQueue(QUEUE_NAMES.MAIL) private mailQueue: Queue`
  — logic: đọc `system.mails`, parse JSON, queue job cho từng email

### Seed config mặc định
Trong `ContactsModule.onModuleInit()` hoặc script seed riêng, upsert config mặc định:
```ts
// Upsert để idempotent — chỉ tạo nếu chưa có, không override nếu đã có
key: 'system.mails', value: [], isActive: true, description: 'Admin emails nhận thông báo contact mới'
```

---

## Spam Protection

### 1. Rate Limiting (ThrottlerModule)
`@nestjs/throttler` đã được cài và cấu hình global trong `AppModule` (100 req/phút).
Route POST /contacts cần override với giới hạn nghiêm hơn:

```ts
// contacts-public.controller.ts
@Throttle({ default: { limit: 3, ttl: 60_000 } })
@Post()
async submit(@Body() dto: SubmitContactDto) { ... }
```

- Không cần thêm ThrottlerModule vào ContactsModule — đã global
- Khi vượt limit → NestJS tự trả `429 Too Many Requests`
- TTL: 60 giây / limit: 3 request per IP

### 2. Honeypot Field
Thêm field ẩn `website` vào DTO — bot thường tự điền, human để trống:

```ts
// submit-contact.dto.ts
@ApiPropertyOptional({ description: 'Leave this field empty' })
@IsOptional()
@IsEmpty({ message: 'Bot detected' })
website?: string;
```

FE (public form ở client) **không render** field này. Bot scraper điền vào → BE trả 400.

**Kết hợp:** Rate-limit chặn flood script, honeypot lọc bot cơ bản — không cần thư viện thêm.

---

## Edge cases & risks
- **Rate-limit bypass qua nhiều IP**: ThrottlerModule chặn theo IP — bot dùng proxy/VPN có thể vượt. Đây là trade-off chấp nhận được ở phase 1.
- **Auto-mark READ side effect**: useEffect trong Dialog có thể fire 2 lần ở React 18 strict mode — cần guard bằng ref hoặc check status trước khi gọi
- **Status enum mismatch**: Thêm giá trị mới vào ContactStatus → phải migrate DB + update FE cùng lúc
- **message field dài**: DTO cần validate maxLength (5000), FE truncate trong DataTable row

---

## Effort estimate
| Phần | Layer | Effort |
|---|---|---|
| BE | Domain | Low |
| BE | Application | Low |
| BE | Infrastructure | Low |
| BE | Presentation | Low |
| FE | Types + Service | Low |
| FE | Hooks | Low |
| FE | Components | Medium |
| FE | Router + i18n | Low |
| **Tổng** | | **Low–Medium** |

---

## Checklist khi implement

### BE
- [ ] `Contact` entity không import NestJS / Prisma
- [ ] Entity có `firstName`, `lastName` (không phải `name`), getter `fullName`
- [ ] Tất cả import trong domain layer dùng relative path
- [ ] `ContactSubmittedEvent` có đủ field: contactId, firstName, lastName, email, subject
- [ ] `ContactRepository` interface có đủ findById, findAll, count, save, delete
- [ ] `InMemoryContactRepository` implement đúng interface
- [ ] `PrismaContactRepository` dùng `ContactMapper` cho mọi conversion
- [ ] `SubmitContactDto` có `firstName`, `lastName` riêng biệt (validate NotEmpty)
- [ ] `SubmitContactDto` validate email (IsEmail), message có maxLength:5000
- [ ] `SubmitContactDto` có field `website?: string` với `@IsOptional @IsEmpty` (honeypot)
- [ ] POST /contacts có `@Throttle({ default: { limit: 3, ttl: 60_000 } })` — override global limit
- [ ] `UpdateContactStatusDto` validate status là ContactStatus enum hợp lệ
- [ ] DTO fields đều có `@ApiProperty` / `@ApiPropertyOptional`
- [ ] POST /contacts có @Public() — không cần AdminAuthGuard
- [ ] Admin routes có @RequirePermission('contacts', ...) đúng action
- [ ] Static route /admin/contacts khai báo TRƯỚC /admin/contacts/:id
- [ ] `ADMIN_NAV_RESOURCES` trong auth.controller.ts có 'contacts'
- [ ] `ContactsModule` được import vào `AppModule` với `EventsModule`, `ConfigModule`
- [ ] `seedRoles()` trong `onModuleInit` dùng `upsert` — idempotent
- [ ] Seed config `system.mails` với value `[]` (upsert, không override nếu đã có)
- [ ] Prisma schema có `first_name`, `last_name` (snake_case) — migration chạy thành công
- [ ] `MAIL_JOBS.SEND_CONTACT_NOTIFICATION` thêm vào `queue.constants.ts`
- [ ] `SendContactNotificationJobData` interface thêm vào `queue.constants.ts`
- [ ] `IMailerService` + `NodemailerMailerService` có method `sendContactNotificationEmail`
- [ ] `MailProcessor` handle case `SEND_CONTACT_NOTIFICATION`
- [ ] `IntegrationModule` có `@OnEvent('contact.submitted')` handler
- [ ] Handler đọc `system.mails` config — nếu rỗng/không tồn tại thì skip (không throw)
- [ ] Handler parse value as `string[]` an toàn (try/catch JSON.parse)

### FE
- [ ] `ContactStatus` type match chính xác BE enum values
- [ ] Service function riêng cho mỗi endpoint
- [ ] `useContactList` dùng `QUERY_KEYS.CONTACTS.LIST`
- [ ] `useUpdateContactStatus` invalidate cả LIST lẫn DETAIL on success
- [ ] `useDeleteContact` invalidate LIST, đóng dialog sau khi xóa
- [ ] Toast success + error cho mọi mutation
- [ ] Status form dùng React Hook Form + Zod
- [ ] Destructive delete có ConfirmDialog
- [ ] Route /contacts dùng lazy loading trong router.tsx
- [ ] `ROUTES.CONTACTS` thêm vào src/config/routes.ts
- [ ] `QUERY_KEYS.CONTACTS` thêm vào src/shared/constants/index.ts
- [ ] Module export qua index.ts
- [ ] i18n keys thêm vào vi.json + en.json

### Sau khi implement
- [ ] be-base/.claude/modules/contacts.md — tạo module doc
- [ ] fe-base-admin/.claude/modules/contacts.md — tạo module doc
