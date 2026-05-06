# Module: modules/notification

## Mục đích
Hệ thống thông báo in-app với real-time WebSocket (Socket.IO). Hỗ trợ gửi tới cá nhân, theo role, hoặc broadcast. Admin có thể gửi và xem lịch sử; user/merchant nhận và quản lý thông báo của mình.

## Cấu trúc
```
modules/notification/
├── domain/
│   ├── entities/
│   │   ├── notification.entity.ts            # { id, title, body, type, senderId, senderType }
│   │   └── notification-recipient.entity.ts  # { notificationId, recipientId, recipientType, readAt, deletedAt }
│   └── repositories/
│       ├── notification.repository.ts           # NOTIFICATION_REPOSITORY
│       └── notification-recipient.repository.ts # NOTIFICATION_RECIPIENT_REPOSITORY
├── application/
│   ├── ports/notification-emitter.port.ts    # NOTIFICATION_EMITTER interface
│   ├── services/
│   │   └── notification-target-resolver.service.ts  # Resolve recipients từ target spec
│   └── use-cases/
│       ├── send-notification.use-case.ts      # exported, dùng bởi IntegrationModule
│       ├── list-my-notifications.use-case.ts
│       ├── get-unread-count.use-case.ts
│       ├── mark-as-read.use-case.ts
│       ├── mark-all-as-read.use-case.ts
│       ├── delete-notification.use-case.ts
│       ├── list-sent-notifications.use-case.ts
│       └── get-sent-notification-detail.use-case.ts
├── infrastructure/
│   ├── gateways/notification.gateway.ts    # Socket.IO gateway, implements NOTIFICATION_EMITTER
│   └── repositories/
│       ├── prisma-notification.repository.ts
│       └── prisma-notification-recipient.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── notification-admin.controller.ts   # /admin/notifications (AdminAuthGuard)
│   │   └── notification-admin.feature.ts
│   └── user/
│       └── notification-user.controller.ts    # /notifications (user JWT)
└── notification.module.ts    # seeds NOTIFICATION_ROLES, exports SendNotificationUseCase
```

## API Routes

### Admin (`/admin/notifications`)
| Method | Path | Permission |
|---|---|---|
| POST | `/admin/notifications` | create (gửi notification) |
| GET | `/admin/notifications` | read (list sent, paginate) |
| GET | `/admin/notifications/:id` | read (detail + recipients) |

### User (`/notifications`)
| Method | Path | Guard |
|---|---|---|
| GET | `/notifications` | UserPermissionGuard — list my notifications |
| GET | `/notifications/unread-count` | UserPermissionGuard |
| PATCH | `/notifications/:id/read` | UserPermissionGuard |
| PATCH | `/notifications/read-all` | UserPermissionGuard |
| DELETE | `/notifications/:id` | UserPermissionGuard |

## Seeded Roles

| Role | SubjectType | Permissions |
|---|---|---|
| notification-manager | admin | notification-management → read, create, delete |

## WebSocket Gateway
```ts
// Client connect: ws://host/notifications?token=<access_token>
// Server emit events:
socket.emit('notification', { id, title, body, type, createdAt })
socket.emit('unread-count', { count: number })
```
`NotificationGateway` implements `NOTIFICATION_EMITTER` port — `SendNotificationUseCase` gọi emitter sau khi lưu DB.

## Targeting
`NotificationTargetResolverService` resolve:
- `{ type: 'individual', recipientId, recipientType }` → gửi 1 người
- `{ type: 'role', roleId, subjectType }` → gửi tất cả có role đó
- `{ type: 'broadcast', subjectType }` → gửi tất cả entity type đó

## Exports
`SendNotificationUseCase` — IntegrationModule dùng để gửi notification từ domain events.

## Dependencies
- Inject `ADMIN_REPOSITORY` + `USER_REPOSITORY` để resolve recipients
