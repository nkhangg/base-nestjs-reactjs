# Refactor: Tách mail infrastructure ra core/mail/

## Vấn đề

`IMailerService`, `NodemailerMailerService` và `MailProcessor` đang nằm trong
`core/auth/` — artifact lịch sử vì password reset là consumer đầu tiên. Sau khi
thêm `sendContactNotificationEmail` và `sendContactReplyEmail`, mailer rõ ràng là
cross-cutting infrastructure, không thuộc auth.

## Mục tiêu

- `core/auth/` chỉ chứa JWT, session, login, password reset logic
- Mailer trở thành `@Global()` module độc lập tại `core/mail/`

---

## Files to CREATE

```
core/mail/
├── mail.module.ts              — @Global(), import MailerModule, export providers
├── mail.interface.ts           — move IMailerService + MAILER_SERVICE symbol
├── mail.service.ts             — move NodemailerMailerService
└── processors/
    └── mail.processor.ts       — move MailProcessor
```

## Files to MODIFY

| File | Thay đổi |
|---|---|
| `core/auth/auth.module.ts` | Xóa MailProcessor khỏi providers, import MailModule |
| `core/auth/infrastructure/mail-queue.service.ts` | Update import IMailerService → từ `core/mail` |
| `app.module.ts` | Thêm MailModule vào imports (nếu không để AuthModule import) |

## Files to DELETE

| File | Lý do |
|---|---|
| `core/auth/domain/services/mailer.interface.ts` | Move sang `core/mail/mail.interface.ts` |
| `core/auth/infrastructure/nodemailer-mailer.service.ts` | Move sang `core/mail/mail.service.ts` |
| `core/auth/infrastructure/mail.processor.ts` | Move sang `core/mail/processors/mail.processor.ts` |

---

## Cấu trúc sau refactor

```
core/
├── auth/          — chỉ còn JWT, session, login, password reset logic
├── mail/          — IMailerService, NodemailerMailerService, MailProcessor
│   └── @Global()  — inject NodemailerMailerService ở bất kỳ đâu
└── integration/   — event handlers → queue
```

---

## Lưu ý khi implement

- `MAILER_SERVICE` symbol cần update tất cả import ở các service đang inject nó
- `MailModule` cần `BullModule.registerQueue(QUEUE_NAMES.MAIL)` — hiện đang có ở
  `IntegrationModule`, kiểm tra để không register trùng (BullMQ cho phép register
  trùng tên queue nhưng tốt hơn là tập trung một chỗ)
- `@Global()` trên `MailModule` → không cần import lại ở `ContactsModule` hay các
  module khác muốn dùng mailer trực tiếp
- `core/integration/handlers/` không bị ảnh hưởng — các handler chỉ inject queue,
  không inject mailer service trực tiếp

---

## Checklist khi implement

- [ ] `IMailerService` và `MAILER_SERVICE` symbol export từ `core/mail`
- [ ] `NodemailerMailerService` implement đúng interface mới
- [ ] `MailProcessor` import job types từ `core/queue/queue.constants`
- [ ] `AuthModule` không còn provide/export mailer-related providers
- [ ] Tất cả import `IMailerService` trong codebase trỏ đúng path mới
- [ ] Không có circular dependency giữa `MailModule` và `AuthModule`
- [ ] Swagger docs không bị ảnh hưởng
- [ ] Làm trong một PR riêng, không mix với feature PR khác
