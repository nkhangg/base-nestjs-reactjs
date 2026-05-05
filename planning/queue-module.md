# Kế hoạch: Queue Module cho tác vụ bất đồng bộ

## Context

Dự án NestJS 11 hiện xử lý **đồng bộ** 2 nhóm tác vụ tốn thời gian:

1. **Gửi email** (`ForgotPasswordUseCase` → `NodemailerMailerService.sendPasswordResetEmail()`) — HTTP response phải chờ SMTP (100–5000ms)
2. **Gửi notification từ domain events** (7 handlers trong `integration/handlers/` → `SendNotificationUseCase.execute()`) — event handler phải chờ DB writes + WebSocket emit

Mục tiêu: thêm BullMQ để đẩy các tác vụ này vào background queue, trả response ngay lập tức.

**Infrastructure đã có:**

- Redis đang chạy trong docker-compose (`be-base-redis:6379`)
- `ioredis` đã cài (dùng cho permission cache)
- `REDIS_URL` đã có trong `.env.example` (đang bị comment)
- MailHog đang chạy ở port 8025 (test email)

---

## Thư viện

```bash
npm install @nestjs/bullmq bullmq
```

BullMQ (không phải Bull cũ) — TypeScript-native, NestJS 11 compatible, tạo ioredis connection riêng (không xung đột với connection caching hiện tại).

---

## Kiến trúc tổng quan

```
QueueModule (@Global)          ← BullMQ root connection (đọc REDIS_URL)
    │
    ├── auth.module.ts
    │   ├── BullModule.registerQueue('mail')
    │   ├── MailQueueService   ← implements IMailerService (producer)
    │   └── MailProcessor      ← @Processor('mail'), gọi NodemailerMailerService (consumer)
    │
    └── integration.module.ts
        ├── BullModule.registerQueue('notification')
        ├── NotificationQueueService  ← producer
        ├── NotificationProcessor     ← @Processor('notification'), gọi SendNotificationUseCase
        └── [7 handlers]              ← inject NotificationQueueService thay vì SendNotificationUseCase
```

---

## Các file cần tạo mới

| File                                                 | Mục đích                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/core/queue/queue.constants.ts`                  | Tên queue, job names, interfaces cho job data                          |
| `src/core/queue/queue.module.ts`                     | `@Global()` module, config BullMQ root connection                      |
| `src/core/auth/infrastructure/mail-queue.service.ts` | Producer — implements `IMailerService`, dispatch job vào queue         |
| `src/core/auth/infrastructure/mail.processor.ts`     | Consumer — `@Processor('mail')`, gọi `NodemailerMailerService`         |
| `src/core/integration/notification-queue.service.ts` | Producer — dispatch notification job                                   |
| `src/core/integration/notification.processor.ts`     | Consumer — `@Processor('notification')`, gọi `SendNotificationUseCase` |

## Các file cần sửa

| File                                         | Thay đổi                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                               | Thêm `@nestjs/bullmq`, `bullmq` vào dependencies                                                                                |
| `.env.example`                               | Bỏ comment `REDIS_URL=redis://localhost:6379`                                                                                   |
| `src/app.module.ts`                          | Import `QueueModule` (trước `IntegrationModule` và `AuthModule`)                                                                |
| `src/core/auth/auth.module.ts`               | Import `BullModule.registerQueue('mail')`, thêm `MailQueueService` + `MailProcessor`, đổi `MAILER_SERVICE` → `MailQueueService` |
| `src/core/integration/integration.module.ts` | Import `BullModule.registerQueue('notification')`, thêm `NotificationQueueService` + `NotificationProcessor`                    |
| 7 handler files                              | Inject `NotificationQueueService` thay vì `SendNotificationUseCase`                                                             |
| `integration.handlers.spec.ts`               | Cập nhật mock factory                                                                                                           |

---

## Chi tiết implementation

### 1. `src/core/queue/queue.constants.ts`

```typescript
export const QUEUE_NAMES = {
  MAIL: "mail",
  NOTIFICATION: "notification",
} as const;

export const MAIL_JOBS = {
  SEND_PASSWORD_RESET: "send-password-reset",
} as const;

export interface SendPasswordResetJobData {
  to: string;
  resetLink: string;
}

export const NOTIFICATION_JOBS = {
  SEND: "send",
} as const;

export interface SendNotificationJobData {
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error";
  data?: Record<string, unknown>;
  targets: NotificationTargetData[];
  senderId?: string;
  senderType?: "admin" | "system";
}

// Serialisable union (không dùng branded types để qua được JSON round-trip)
export type NotificationTargetData =
  | { kind: "individual"; recipientId: string; recipientType: "user" | "admin" }
  | { kind: "by-role"; roleName: string; subjectType: "user" | "admin" }
  | {
      kind: "by-permission";
      resource: string;
      action: string;
      subjectType: "user" | "admin";
    }
  | { kind: "all-users" }
  | { kind: "all-admins" }
  | { kind: "broadcast" };
```

### 2. `src/core/queue/queue.module.ts`

```typescript
@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

### 3. `src/core/auth/infrastructure/mail-queue.service.ts`

```typescript
@Injectable()
export class MailQueueService implements IMailerService {
  constructor(
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {}

  async sendPasswordResetEmail(params: {
    to: string;
    resetLink: string;
  }): Promise<void> {
    await this.mailQueue.add(MAIL_JOBS.SEND_PASSWORD_RESET, params);
  }
}
```

### 4. `src/core/auth/infrastructure/mail.processor.ts`

```typescript
@Processor(QUEUE_NAMES.MAIL)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: NodemailerMailerService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MAIL_JOBS.SEND_PASSWORD_RESET: {
        const data = job.data as SendPasswordResetJobData;
        await this.mailerService.sendPasswordResetEmail(data);
        break;
      }
    }
  }
}
```

> **Tại sao `MailProcessor` nằm trong `auth.module.ts`?**
> `MailerModule.forRoot()` đã được import trong `auth.module.ts` → `NodemailerMailerService` có sẵn trong DI context của AuthModule → `MailProcessor` inject được trực tiếp, không cần export `MailerModule` ra ngoài.

### 5. Thay đổi trong `auth.module.ts`

```typescript
imports: [
  BullModule.registerQueue({ name: QUEUE_NAMES.MAIL }),  // thêm
  MailerModule.forRoot({ ... }),                          // giữ nguyên
],
providers: [
  NodemailerMailerService,    // giữ nguyên (MailProcessor cần)
  MailQueueService,           // thêm
  MailProcessor,              // thêm
  {
    provide: MAILER_SERVICE,
    useExisting: MailQueueService,  // đổi từ NodemailerMailerService
  },
  // ... các provider khác giữ nguyên
],
```

`ForgotPasswordUseCase` **không thay đổi** — nó inject `MAILER_SERVICE` token, chỉ cần swap implementation.

### 6. `src/core/integration/notification-queue.service.ts`

```typescript
@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly queue: Queue,
  ) {}

  async enqueue(data: SendNotificationJobData): Promise<void> {
    await this.queue.add(NOTIFICATION_JOBS.SEND, data);
  }
}
```

### 7. `src/core/integration/notification.processor.ts`

```typescript
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly sendNotification: SendNotificationUseCase) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === NOTIFICATION_JOBS.SEND) {
      const data = job.data as SendNotificationJobData;
      await this.sendNotification.execute({
        ...data,
        targets: data.targets as NotificationTarget[], // safe cast — same shape
      });
    }
  }
}
```

### 8. Thay đổi trong mỗi handler (pattern chung)

```typescript
// BEFORE
constructor(private readonly sendNotification: SendNotificationUseCase) {}
await this.sendNotification.execute({ targets, title, body, type, senderType });

// AFTER
constructor(private readonly notificationQueue: NotificationQueueService) {}
await this.notificationQueue.enqueue({ targets, title, body, type, senderType });
```

### 9. `integration.module.ts`

```typescript
@Module({
  imports: [
    NotificationModule,  // giữ nguyên — NotificationProcessor cần SendNotificationUseCase
    BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATION }),
  ],
  providers: [
    NotificationQueueService,
    NotificationProcessor,
    ...allHandlers,  // giờ inject NotificationQueueService
  ],
})
```

---

## Luồng hoạt động sau khi implement

**Email (trước):**

```
POST /auth/forgot-password → ForgotPasswordUseCase → SMTP (sync, 1-5s) → 200 OK
```

**Email (sau):**

```
POST /auth/forgot-password → ForgotPasswordUseCase → enqueue job (<5ms) → 200 OK
[Background] MailProcessor → NodemailerMailerService → SMTP
```

**Notification (trước):**

```
Event 'user.created' → OnUserCreatedHandler → SendNotificationUseCase (sync DB writes) → done
```

**Notification (sau):**

```
Event 'user.created' → OnUserCreatedHandler → enqueue job (<5ms) → done
[Background] NotificationProcessor → SendNotificationUseCase (DB writes + WebSocket)
```

---

## Retry policy

- **3 lần retry** với exponential backoff: 1s → 2s → 4s
- Sau 3 lần thất bại → job vào trạng thái `failed`, giữ lại 500 jobs gần nhất để debug
- Giữ lại 100 completed jobs cho observability

---

## Verification

1. **Khởi động**: `REDIS_URL=redis://localhost:6379 npm run start:dev` — kiểm tra log thấy `BullMQ connected`
2. **Email**: Gọi `POST /auth/forgot-password` → response < 100ms → vào MailHog (http://localhost:8025) thấy email đến sau vài giây
3. **Notification**: Tạo user mới → kiểm tra DB table `notifications` thấy record xuất hiện sau vài giây (không blocking)
4. **Retry**: Tắt MailHog → gọi forgot-password → xem log thấy 3 lần retry → bật lại MailHog xem job succeed
5. **Build**: `npm run build` không có TypeScript errors

---

## Gotchas quan trọng

1. **`QueueModule` phải import TRƯỚC** `IntegrationModule` và `AuthModule.forRoot()` trong `app.module.ts`
2. **`MailProcessor` không catch errors** trong `process()` — để BullMQ tự handle retry
3. **`NotificationTargetData.action`** là `string`, khác với `Action` branded type — cast `as NotificationTarget[]` là safe ở runtime
4. **BullMQ tạo ioredis connection riêng** — không reuse REDIS_CLIENT từ AuthorizationModule (tránh xung đột với blocking commands)
5. **`AuthModule.forRoot()` là DynamicModule** — `BullModule.registerQueue()` phải nằm trong `imports` của returned object, không phải trong `@Module()` decorator
