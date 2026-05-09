# Module: modules/contacts

## Mục đích
Quản lý form liên hệ (contact us) từ người dùng gửi lên. Admin có thể xem, đổi trạng thái, ghi chú và xóa. Khi có contact mới, hệ thống tự động gửi email thông báo tới admin.

## Cấu trúc trường dữ liệu quan trọng
- `note` — ghi chú nội bộ của admin (không gửi ra ngoài)
- `replyMessage` — nội dung email đã phản hồi tới khách hàng (được set bởi `reply()`, hiển thị read-only trong FE)

## Cấu trúc
```
src/modules/contacts/
├── domain/
│   ├── entities/
│   │   └── contact.entity.ts           — ContactStatus, ContactProps, Contact entity
│   ├── value-objects/
│   │   └── contact-id.vo.ts            — ContactId extends ValueObject
│   ├── repositories/
│   │   └── contact.repository.ts       — CONTACT_REPOSITORY symbol, IContactRepository
│   └── events/
│       ├── contact-submitted.event.ts  — ContactSubmittedEvent (name='contact.submitted')
│       └── contact-replied.event.ts    — ContactRepliedEvent (name='contact.replied')
├── application/
│   └── use-cases/
│       ├── submit-contact.use-case.ts       — plain return {contactId}
│       ├── list-contacts.use-case.ts        — plain return {data, total}
│       ├── get-contact.use-case.ts          — Result<Contact, 'NOT_FOUND'>
│       ├── update-contact-status.use-case.ts — Result<Contact, 'NOT_FOUND'>
│       ├── reply-to-contact.use-case.ts     — Result<Contact, 'NOT_FOUND'>, publishes ContactRepliedEvent
│       └── delete-contact.use-case.ts       — Result<void, 'NOT_FOUND'>
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-contact.repository.ts    — OR search, upsert in save()
│   │   └── in-memory-contact.repository.ts — Map-based, filter/sort/slice
│   └── mappers/
│       └── contact.mapper.ts               — toDomain() / toPrisma()
├── presentation/
│   ├── admin/
│   │   ├── contacts-admin.controller.ts    — AdminAuthGuard, CRUD routes
│   │   └── contacts-admin.feature.ts       — AdminFeature config
│   └── public/
│       └── contacts-public.controller.ts   — @Public, @Throttle(3/60s), honeypot
└── contacts.module.ts
```

## API Routes

### Admin (`/admin/contacts`)
| Method | Path | Use-case | Permission |
|---|---|---|---|
| GET | `/admin/contacts` | ListContactsUseCase | read |
| GET | `/admin/contacts/:id` | GetContactUseCase | read |
| PATCH | `/admin/contacts/:id` | UpdateContactStatusUseCase | update |
| POST | `/admin/contacts/:id/reply` | ReplyToContactUseCase | update |
| DELETE | `/admin/contacts/:id` | DeleteContactUseCase | delete |

### Public (`/contacts`)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/contacts` | Submit form — rate-limited 3 req/60s, honeypot field |

## Seeded Roles
| Role key | Resource | Actions |
|---|---|---|
| contacts-reader | contacts | read |
| contacts-manager | contacts | read, update, delete |

## Domain Events Published
- `contact.submitted` — fired by `SubmitContactUseCase` after save
  - Payload: `{ contactId, firstName, lastName, email, subject }`
  - Handler: `OnContactSubmittedHandler` → reads `system.mails` AppConfig → queues SEND_CONTACT_NOTIFICATION jobs
- `contact.replied` — fired by `ReplyToContactUseCase` after save
  - Payload: `{ contactId, customerEmail, customerFirstName, customerLastName, subject, replyMessage }`
  - Handler: `OnContactRepliedHandler` → queues SEND_CONTACT_REPLY job → gửi email tới khách hàng

## AppConfig seeded
- Key: `system.mails` — value: `[]` (JSON array of admin email strings), `isActive: true`
- Seeded via upsert in `onModuleInit` — existing values preserved

## Spam Protection
- Rate limiting: `@Throttle({ default: { limit: 3, ttl: 60_000 } })` on POST `/contacts`
- Honeypot: `website?` field in SubmitContactDto with `@IsOptional @IsEmpty` — bots fill it → 400

## Dependencies
- `EventsModule` (for DOMAIN_EVENT_BUS)
- `BullModule.registerQueue(QUEUE_NAMES.MAIL)` in IntegrationModule
- `PrismaService` (via PrismaModule global)
