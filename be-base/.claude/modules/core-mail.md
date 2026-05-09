# Module: core/mail

## Mục đích
Cross-cutting mail infrastructure — `@Global()` module cung cấp `IMailerService` cho toàn app. Bất kỳ module nào cần gửi mail chỉ cần inject `MAILER_SERVICE` mà không cần import `MailModule`.

## Cấu trúc
```
core/mail/
├── mail.module.ts              — @Global(), MailerModule.forRoot, BullModule.registerQueue(MAIL)
├── mail.interface.ts           — IMailerService interface + MAILER_SERVICE symbol
├── mail.service.ts             — NodemailerMailerService (SMTP via @nestjs-modules/mailer)
├── mail-queue.service.ts       — MailQueueService (implements IMailerService, enqueues jobs)
├── processors/
│   └── mail.processor.ts       — @Processor(QUEUE_NAMES.MAIL), consume jobs → NodemailerMailerService
└── templates/
    └── reset-password.hbs      — Handlebars template cho password reset email
```

## Flow
```
Caller (use-case/handler)
  → inject MAILER_SERVICE (= MailQueueService)
    → BullMQ Queue (QUEUE_NAMES.MAIL)
      → MailProcessor.process(job)
        → NodemailerMailerService (SMTP)
          → Email server
```

## Inject IMailerService
```ts
constructor(
  @Inject(MAILER_SERVICE) private readonly mailerService: IMailerService,
) {}
```
Import từ `core/mail/mail.interface`.

## Mail Jobs (in core/queue/queue.constants.ts)
| Job | Data |
|---|---|
| `MAIL_JOBS.SEND_PASSWORD_RESET` | `{ to, resetLink }` |
| `MAIL_JOBS.SEND_CONTACT_NOTIFICATION` | `{ to, firstName, lastName, email, subject }` |
| `MAIL_JOBS.SEND_CONTACT_REPLY` | `{ to, firstName, lastName, subject, replyMessage }` |

## Thêm mail type mới
1. Thêm job name vào `MAIL_JOBS` trong `core/queue/queue.constants.ts`
2. Thêm interface data type trong `queue.constants.ts`
3. Thêm method vào `IMailerService` trong `mail.interface.ts`
4. Implement method trong `NodemailerMailerService` (`mail.service.ts`)
5. Implement method trong `MailQueueService` (`mail-queue.service.ts`)
6. Thêm case vào `MailProcessor.process()` (`processors/mail.processor.ts`)
7. Thêm template `.hbs` nếu cần (Handlebars)

## Env
| Var | Default | Mô tả |
|---|---|---|
| `MAIL_HOST` | `localhost` | SMTP host |
| `MAIL_PORT` | `1025` | SMTP port |
| `MAIL_USER` | *(optional)* | SMTP username |
| `MAIL_PASS` | *(optional)* | SMTP password |
| `MAIL_FROM` | `No Reply <noreply@example.com>` | From address |

## Notes
- `MailModule` là `@Global()` — không cần import lại ở các module consumer
- `IntegrationModule` giữ `BullModule.registerQueue(MAIL)` riêng vì các contact handlers inject `@InjectQueue(MAIL)` trực tiếp
- Templates Handlebars nằm tại `core/mail/templates/` (trước đây ở `core/auth/infrastructure/templates/`)
