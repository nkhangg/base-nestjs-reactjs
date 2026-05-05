# Kế hoạch: Events & Integration Module

## Context

Trước khi implement Notification Module, cần xây dựng nền tảng **event-driven** để các module có thể giao tiếp loose-coupled.

**Hiện trạng:**
- `core/events/` đã có `EventsModule` (EventEmitter2 global) + `EventPublisher` nhưng **chưa được dùng ở đâu**
- Không có `@OnEvent` handler nào trong codebase
- Các side-effect cross-module (notify admin khi user register, gửi email welcome...) chưa có cơ chế

**Mục tiêu:**
- Mỗi module emit typed domain event sau khi business logic hoàn thành
- `core/integration/` là nơi duy nhất định nghĩa cross-module side-effects
- Module gốc (User, Admin, Media...) không biết ai lắng nghe event của nó

---

## Kiến trúc tổng quan

```
UserModule.createUser()
  → repo.save(user)
  → eventBus.publish(new UserCreatedEvent({ userId, email }))
                                ↑ fire-and-forget, use-case không await handler

core/integration/OnUserCreatedHandler
  @OnEvent('user.created')      ← lắng nghe, xử lý side-effects
  → notificationService.send(...)   ← notify admin
  → mailerService.sendWelcome(...)  ← welcome email (khi có mailer)
```

**Nguyên tắc:**
- Module gốc chỉ `publish(event)` — không biết ai xử lý, không await handler
- `core/integration/` là nơi duy nhất import nhiều feature module cùng lúc
- Handler fail không ảnh hưởng response của request gốc

---

## Phase 1: Enhance `core/events/`

### Files cần tạo

**`core/events/domain/domain-event.base.ts`**
```typescript
export abstract class DomainEvent {
  readonly occurredAt: Date = new Date();
  abstract readonly eventName: string;
}
```

**`core/events/domain/domain-event-bus.interface.ts`**
```typescript
export const DOMAIN_EVENT_BUS = Symbol('DOMAIN_EVENT_BUS');

export interface IDomainEventBus {
  publish(event: DomainEvent): void;
  publishAll(events: DomainEvent[]): void;
}
```

### Files cần sửa

**`core/events/event-publisher.service.ts`** — implement IDomainEventBus:
```typescript
@Injectable()
export class EventPublisher implements IDomainEventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.emitter.emit(event.eventName, event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach(e => this.publish(e));
  }
}
```

**`core/events/events.module.ts`** — export IDomainEventBus:
```typescript
@Global()
@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })],
  providers: [
    EventPublisher,
    { provide: DOMAIN_EVENT_BUS, useExisting: EventPublisher },
  ],
  exports: [DOMAIN_EVENT_BUS],
})
export class EventsModule {}
```

---

## Phase 2: Typed Domain Events

Mỗi module tự định nghĩa event trong `domain/events/` của nó.

### `modules/user/domain/events/`
| File | `eventName` | Payload |
|------|------------|---------|
| `user-created.event.ts` | `user.created` | `userId, email, role` |
| `user-activated.event.ts` | `user.activated` | `userId` |
| `user-deactivated.event.ts` | `user.deactivated` | `userId` |
| `user-role-changed.event.ts` | `user.role_changed` | `userId, oldRole, newRole` |
| `user-email-changed.event.ts` | `user.email_changed` | `userId, oldEmail, newEmail` |

### `modules/admin/domain/events/`
| File | `eventName` | Payload |
|------|------------|---------|
| `admin-created.event.ts` | `admin.created` | `adminId, email, role` |
| `admin-deactivated.event.ts` | `admin.deactivated` | `adminId` |
| `admin-role-changed.event.ts` | `admin.role_changed` | `adminId, oldRole, newRole` |

### `modules/media/domain/events/`
| File | `eventName` | Payload |
|------|------------|---------|
| `file-uploaded.event.ts` | `media.file_uploaded` | `fileId, filename, uploadedBy` |

### `modules/config/domain/events/`
| File | `eventName` | Payload |
|------|------------|---------|
| `config-changed.event.ts` | `config.changed` | `configId, key, oldValue, newValue, changedBy` |

**Pattern event class:**
```typescript
// user-created.event.ts
import { DomainEvent } from '../../../../core/events/domain/domain-event.base';

export class UserCreatedEvent extends DomainEvent {
  readonly eventName = 'user.created';
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: string,
  ) { super(); }
}
```

---

## Phase 3: Cập nhật Use-Cases

Inject `IDomainEventBus`, emit event sau `repo.save()`. **Pattern:**

```typescript
constructor(
  @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
) {}

async execute(dto: CreateUserDto) {
  // ... business logic ...
  await this.userRepo.save(user);
  this.eventBus.publish(new UserCreatedEvent(user.id.value, user.email, role));
  return { ok: true, value: { userId: user.id.value } };
}
```

### Use-cases cần cập nhật

| Use-case | Event emit |
|----------|-----------|
| `modules/user/application/use-cases/create-user.use-case.ts` | `UserCreatedEvent` |
| `modules/user/application/use-cases/activate-user.use-case.ts` | `UserActivatedEvent` |
| `modules/user/application/use-cases/deactivate-user.use-case.ts` | `UserDeactivatedEvent` |
| `modules/user/application/use-cases/update-user-role.use-case.ts` | `UserRoleChangedEvent` |
| `modules/user/application/use-cases/update-user-info.use-case.ts` | `UserEmailChangedEvent` (chỉ khi email thay đổi) |
| `modules/admin/application/use-cases/create-admin.use-case.ts` | `AdminCreatedEvent` |
| `modules/admin/application/use-cases/deactivate-admin.use-case.ts` | `AdminDeactivatedEvent` |
| `modules/admin/application/use-cases/update-admin-role.use-case.ts` | `AdminRoleChangedEvent` |
| `modules/media/application/use-cases/upload-file.use-case.ts` | `FileUploadedEvent` |
| `modules/config/application/use-cases/update-config.use-case.ts` | `ConfigChangedEvent` |

**Lưu ý:** `DOMAIN_EVENT_BUS` là global (từ `EventsModule @Global()`) — không cần import module, chỉ inject token.

---

## Phase 4: `core/integration/` — Orchestration Module

### Cấu trúc file
```
core/integration/
├── handlers/
│   ├── on-user-created.handler.ts
│   ├── on-user-deactivated.handler.ts
│   ├── on-admin-created.handler.ts
│   ├── on-admin-deactivated.handler.ts
│   ├── on-file-uploaded.handler.ts
│   └── on-config-changed.handler.ts
└── integration.module.ts
```

### Handlers mặc định (MVP)

| Handler | Trigger | Action |
|---------|---------|--------|
| `OnUserCreatedHandler` | `user.created` | Notify tất cả admin: "Tài khoản mới đăng ký" |
| `OnUserDeactivatedHandler` | `user.deactivated` | Notify admin: "Tài khoản bị khóa" |
| `OnAdminCreatedHandler` | `admin.created` | Notify super-admin: "Admin mới được tạo" |
| `OnAdminDeactivatedHandler` | `admin.deactivated` | Notify super-admin: "Admin bị vô hiệu hóa" |
| `OnFileUploadedHandler` | `media.file_uploaded` | Notify uploader: "Upload thành công" |
| `OnConfigChangedHandler` | `config.changed` | Notify tất cả admin: "Config đã thay đổi" |

### Ví dụ handler
```typescript
// on-user-created.handler.ts
@Injectable()
export class OnUserCreatedHandler {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('user.created')
  async handle(event: UserCreatedEvent): Promise<void> {
    await this.notificationService.send({
      targets: [{ kind: 'role', role: 'admin', subjectType: 'admin' }],
      title: 'Tài khoản mới đăng ký',
      body: `${event.email} vừa tạo tài khoản`,
      type: 'info',
    });
  }
}
```

### `integration.module.ts`
```typescript
@Module({
  imports: [NotificationModule],  // thêm MailerModule khi có
  providers: [
    OnUserCreatedHandler,
    OnUserDeactivatedHandler,
    OnAdminCreatedHandler,
    OnAdminDeactivatedHandler,
    OnFileUploadedHandler,
    OnConfigChangedHandler,
  ],
})
export class IntegrationModule {}
```

Import vào `app.module.ts` SAU `NotificationModule`.

---

## Phase 5 (Đề xuất): `core/mailer/` — Email Service

Hiện project **không có email** nào. Cần bổ sung để xử lý:
- Welcome email khi user register
- Cảnh báo bảo mật (đăng nhập thiết bị mới)
- Password reset (future)

### Cấu trúc
```
core/mailer/
├── domain/
│   └── mailer.interface.ts         # IMailerService + MAILER_SERVICE token
├── application/templates/
│   ├── welcome.template.ts
│   └── security-alert.template.ts
├── infrastructure/
│   └── nodemailer.service.ts       # implements IMailerService
└── mailer.module.ts                # @Global(), export MAILER_SERVICE
```

### Env vars cần thêm
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-password
SMTP_FROM="App Name <noreply@example.com>"
```

**Kích hoạt trong Integration handlers** sau khi `core/mailer/` được build — hiện để commented-out.

---

## Phase 6 (Đề xuất): Scheduled Jobs

Dùng `@nestjs/schedule` cho các task định kỳ:

| Job | Schedule | Mô tả |
|-----|----------|-------|
| `CleanExpiredSessionsJob` | Hàng ngày 2:00 AM | Xóa sessions hết hạn > 30 ngày |
| `CleanDeletedMediaJob` | Hàng tuần Chủ nhật | Xóa file đã soft-delete > 7 ngày |
| `NotificationDigestJob` | Hàng ngày 8:00 AM | Email tóm tắt notifications chưa đọc (cần mailer) |

Tạo tại `core/scheduler/` hoặc từng job nằm trong module liên quan.

---

## Thứ tự Implementation

1. **Enhance `core/events/`** — `DomainEvent` base, `IDomainEventBus`, update `EventPublisher` + `EventsModule`
2. **Typed event classes** — User (5), Admin (3), Media (1), Config (1)
3. **Cập nhật 10 use-cases** — inject `DOMAIN_EVENT_BUS`, emit sau `repo.save()`
4. **Notification Module** — xem `planning/notification-module.md`
5. **`core/integration/`** — handlers + `IntegrationModule`, import vào `app.module.ts`
6. *(Optional)* **`core/mailer/`** → bật mailer calls trong handlers
7. *(Optional)* **Scheduled jobs** với `@nestjs/schedule`

---

## Files cần chỉnh sửa (tóm tắt)

| File | Thay đổi |
|------|----------|
| `core/events/event-publisher.service.ts` | Implement `IDomainEventBus` |
| `core/events/events.module.ts` | Export `DOMAIN_EVENT_BUS` |
| `be-base/src/app.module.ts` | Import `IntegrationModule` |
| 10 use-cases (xem bảng Phase 3) | Inject + emit event |

---

## Verification

```bash
# Build check
cd be-base && npm run build    # zero TS errors

# Unit tests
npx jest --testPathPattern="core/events|core/integration" --no-coverage

# End-to-end manual
# 1. POST /admin/users → check server log: '[EventEmitter] user.created emitted' ✓
# 2. FE admin đang online → NotificationBell badge tăng ngay ✓
# 3. Deactivate user → admin nhận notification 'Tài khoản bị khóa' ✓
# 4. Upload file → uploader nhận notification 'Upload thành công' ✓
# 5. Admin thay đổi config → tất cả admin online nhận notification ✓
```
