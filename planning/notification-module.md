# Kế hoạch: Module Notification

## Context

Dự án cần một hệ thống thông báo (notification) để gửi thông báo đến các entity riêng biệt (admin, user, merchant…). Hệ thống phải hỗ trợ gửi tới từng cá nhân, theo nhóm (role), hoặc broadcast toàn bộ. Real-time qua WebSocket (Socket.IO) sẽ được **triển khai luôn**, hiển thị trên fe-base-admin.

---

## Tính năng đề xuất

### Phía Admin (quản trị / gửi thông báo)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 1 | Gửi thông báo | Gửi đến: cá nhân, theo role, tất cả users, tất cả admins, hoặc broadcast |
| 2 | Xem lịch sử gửi | Danh sách các thông báo đã gửi (paginated) |
| 3 | Xem chi tiết | Xem recipients của từng thông báo |

### Phía Recipient (user/admin nhận thông báo)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 4 | Xem thông báo | Danh sách thông báo của mình (paginated) |
| 5 | Đếm chưa đọc | Badge số thông báo chưa đọc |
| 6 | Đánh dấu đã đọc | Mark một hoặc tất cả là đã đọc |
| 7 | Xóa thông báo | Soft-delete (ẩn với người nhận, không xóa DB) |
| 8 | Lọc & tìm kiếm | Filter theo type, isRead; search theo title/body |

### Tính năng nâng cao (đề xuất thêm)
| # | Tính năng | Mô tả |
|---|-----------|-------|
| 9 | Notification Preference | User/admin tắt/bật loại thông báo nhất định |
| 10 | Notification Types | system / info / warning / alert / success |
| 11 | Metadata payload | Trường `data: JSON` chứa link hoặc context thêm |
| 12 | Real-time | Nhận thông báo tức thì qua WebSocket (Socket.IO) — hiển thị toast + cập nhật badge |

---

## Những thứ cần thiết

### Dependencies cần thêm

**Backend:**
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Frontend:**
```bash
npm install socket.io-client
```

### Prisma Models cần thêm
```prisma
model Notification {
  id         String   @id
  type       String   // 'system' | 'info' | 'warning' | 'alert' | 'success'
  title      String
  body       String
  data       Json?    // extra payload (link, entity ref, ...)
  senderId   String?  // null = system-generated
  senderType String?  // 'admin' | 'system'
  createdAt  DateTime @default(now())
  
  recipients NotificationRecipient[]
  @@map("notifications")
}

model NotificationRecipient {
  id             String    @id
  notificationId String
  recipientId    String
  recipientType  String    // 'user' | 'admin'
  isRead         Boolean   @default(false)
  readAt         DateTime?
  isDeleted      Boolean   @default(false)
  deletedAt      DateTime?
  createdAt      DateTime  @default(now())
  
  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  
  @@unique([notificationId, recipientId, recipientType])
  @@index([recipientId, recipientType])
  @@map("notification_recipients")
}

model NotificationPreference {
  id            String   @id
  recipientId   String
  recipientType String   // 'user' | 'admin'
  type          String   // notification type
  isEnabled     Boolean  @default(true)
  updatedAt     DateTime @updatedAt
  
  @@unique([recipientId, recipientType, type])
  @@map("notification_preferences")
}
```

---

## Cấu trúc module Backend

```
be-base/src/modules/notification/
├── domain/
│   ├── entities/
│   │   ├── notification.entity.ts            # Extends BaseAggregate
│   │   └── notification-recipient.entity.ts  # Extends BaseEntity
│   ├── repositories/
│   │   ├── notification.repository.ts        # Interface + Symbol token
│   │   └── notification-recipient.repository.ts
│   └── value-objects/
│       ├── notification-id.vo.ts
│       └── notification-type.vo.ts           # enum: system|info|warning|alert|success
│
├── application/
│   ├── use-cases/
│   │   ├── send-notification.use-case.ts     # Fan-out targets → recipients
│   │   ├── list-my-notifications.use-case.ts # Lấy danh sách thông báo của recipient
│   │   ├── get-unread-count.use-case.ts      # Đếm chưa đọc
│   │   ├── mark-as-read.use-case.ts          # Mark 1 thông báo
│   │   ├── mark-all-as-read.use-case.ts      # Mark tất cả
│   │   ├── delete-notification.use-case.ts   # Soft-delete
│   │   └── list-sent-notifications.use-case.ts # Admin xem lịch sử
│   └── services/
│       └── notification-target-resolver.service.ts  # Resolve targets → recipientIds
│           # (gọi UserRepo, AdminRepo, RoleAssignmentRepo để tìm danh sách recipients)
│
├── infrastructure/
│   ├── mappers/
│   │   └── notification.mapper.ts
│   ├── gateways/
│   │   └── notification.gateway.ts   # @WebSocketGateway namespace '/notifications'
│   │       # handleConnection(): validate JWT → join room 'admin:{id}'
│   │       # emitToRecipient(recipientId, recipientType, payload): emit 'notification'
│   └── repositories/
│       ├── prisma-notification.repository.ts
│       ├── prisma-notification-recipient.repository.ts
│       ├── in-memory-notification.repository.ts      # Dùng cho test
│       └── in-memory-notification-recipient.repository.ts
│
├── presentation/
│   ├── admin/
│   │   ├── notification-admin.controller.ts   # /admin/notifications
│   │   └── notification-admin.feature.ts      # AdminFeature registration
│   └── user/
│       └── notification-user.controller.ts    # /notifications (UserPermissionGuard)
│
└── notification.module.ts                     # Seed NOTIFICATION_ROLES on init
```

---

## API Routes

### Admin (`/admin/notifications`)
| Method | Path | Permission | Mô tả |
|--------|------|------------|-------|
| `POST` | `/admin/notifications` | `notification-management` create | Gửi thông báo |
| `GET` | `/admin/notifications/sent` | `notification-management` read | Lịch sử đã gửi (paginated) |
| `GET` | `/admin/notifications/sent/:id` | `notification-management` read | Chi tiết + danh sách recipients |

### User/Recipient (`/notifications`)
| Method | Path | Guard | Mô tả |
|--------|------|-------|-------|
| `GET` | `/notifications` | `UserPermissionGuard` notifications read | Danh sách thông báo |
| `GET` | `/notifications/unread-count` | `UserPermissionGuard` | Đếm chưa đọc |
| `PATCH` | `/notifications/read-all` | `UserPermissionGuard` notifications update | Mark all đã đọc |
| `PATCH` | `/notifications/:id/read` | `UserPermissionGuard` notifications update | Mark 1 đã đọc |
| `DELETE` | `/notifications/:id` | `UserPermissionGuard` notifications update | Soft-delete |

> **Lưu ý route ordering**: `/notifications/unread-count` và `/notifications/read-all` PHẢI khai báo TRƯỚC `/notifications/:id`

---

## Target Specification (Send Notification Input)

```typescript
type NotificationTarget =
  | { kind: 'individual'; recipientId: string; recipientType: 'user' | 'admin' }
  | { kind: 'by-role'; roleName: string; subjectType: 'user' | 'admin' }
  | { kind: 'all-users' }
  | { kind: 'all-admins' }
  | { kind: 'broadcast' }  // gửi đến tất cả user + admin

interface SendNotificationInput {
  title: string;
  body: string;
  type: 'system' | 'info' | 'warning' | 'alert' | 'success';
  data?: Record<string, unknown>;
  targets: NotificationTarget[];
  senderId?: string;      // adminId nếu gửi từ admin
  senderType?: 'admin' | 'system';
}
```

---

## Cấu trúc module Frontend

```
fe-base-admin/src/modules/notification/
├── components/
│   ├── NotificationPage.tsx          # Admin UI: gửi thông báo + lịch sử
│   ├── SendNotificationModal.tsx     # Form modal: chọn target, type, title, body
│   ├── NotificationBell.tsx          # Bell icon + unread badge (dùng trong MainLayout)
│   └── NotificationDropdown.tsx      # Dropdown danh sách recent notifications
├── hooks/
│   ├── useMyNotifications.ts         # useQuery: GET /notifications
│   ├── useUnreadCount.ts             # useQuery: GET /notifications/unread-count
│   ├── useSendNotification.ts        # useMutation: POST /admin/notifications
│   ├── useMarkAsRead.ts              # useMutation: PATCH /notifications/:id/read
│   ├── useMarkAllAsRead.ts           # useMutation: PATCH /notifications/read-all
│   ├── useDeleteNotification.ts      # useMutation: DELETE /notifications/:id
│   └── useNotificationSocket.ts      # socket.io-client: connect → listen 'notification'
│       # → invalidate queries + show toast khi nhận event mới
├── services/
│   └── notification.service.ts       # API calls
├── types/
│   └── index.ts                      # Notification, NotificationTarget, types
└── index.ts                          # Public exports
```

### Files cần chỉnh sửa (Frontend)
| File | Thay đổi |
|------|----------|
| `src/app/router.tsx` | Thêm route `/notifications` và `/admin/notifications` |
| `src/config/routes.ts` | Thêm `ROUTES.NOTIFICATIONS`, `ROUTES.ADMIN_NOTIFICATIONS` |
| `src/shared/constants/QUERY_KEYS.ts` | Thêm notification query keys |
| `src/shared/layouts/MainLayout.tsx` | Nhúng `NotificationBell` vào header |

---

## Files cần chỉnh sửa (Backend)

| File | Thay đổi |
|------|----------|
| `be-base/prisma/schema.prisma` | Thêm 3 models: Notification, NotificationRecipient, NotificationPreference |
| `be-base/src/app.module.ts` | Import `NotificationModule` |
| `be-base/src/modules/user/user.module.ts` | Đảm bảo `notifications (r/u)` đã có trong USER_ROLES (đã seed sẵn) |

---

## Seeding Roles cho Notification

```typescript
// Thêm vào NOTIFICATION_ADMIN_ROLES trong notification.module.ts (onModuleInit)
{
  name: 'admin',  // role admin đã có, extend permissions
  subjectType: 'admin',
  permissions: {
    'notification-management': ['read', 'create', 'delete'],
  }
}

// USER_ROLES đã có sẵn trong user.module.ts:
// member → notifications: ['read', 'update']  ← đã đủ
```

---

## Real-time — WebSocket (Socket.IO)

### Backend: `NotificationGateway`

```typescript
// infrastructure/gateways/notification.gateway.ts
@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*', credentials: true } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // handleConnection(): đọc JWT từ socket.handshake.auth.token
  //   → verify bằng JwtTokenService
  //   → socket.join('admin:{adminId}') hoặc 'user:{userId}'
  //   → nếu invalid token: socket.disconnect()

  // handleDisconnect(): cleanup

  emitToRecipient(recipientId: string, recipientType: string, payload: NotificationPayload) {
    this.server.to(`${recipientType}:${recipientId}`).emit('notification', payload);
  }
}
```

`SendNotificationUseCase` inject `NotificationGateway` — sau khi persist recipients, gọi `gateway.emitToRecipient()` cho từng recipient.

### Frontend: `useNotificationSocket`

```typescript
// hooks/useNotificationSocket.ts
export function useNotificationSocket() {
  // 1. Lấy token từ localStorage (VITE_TOKEN_KEY)
  // 2. Khởi tạo socket: io('/notifications', { auth: { token } })
  // 3. socket.on('notification', (data) => {
  //      queryClient.invalidateQueries(QUERY_KEYS.NOTIFICATIONS)
  //      queryClient.invalidateQueries(QUERY_KEYS.NOTIFICATIONS_UNREAD_COUNT)
  //      toast({ title: data.title, description: data.body })  // shadcn toast
  //    })
  // 4. Cleanup on unmount: socket.disconnect()
}
```

Hook này được gọi trong `NotificationBell` — đảm bảo socket chỉ connect 1 lần khi admin đăng nhập, tự disconnect khi unmount.

### Luồng hoạt động end-to-end

```
Admin gửi POST /admin/notifications
  → SendNotificationUseCase: persist Notification + NotificationRecipients (DB)
  → NotificationGateway.emitToRecipient() cho từng recipient
  → fe-admin nhận socket event 'notification'
  → queryClient.invalidate() → refetch badge + list
  → shadcn Toast hiện thông báo tức thì
```

> **Ghi chú scale**: Hiện dùng single-instance memory. Nếu sau này scale multi-instance, thêm Redis adapter (`@socket.io/redis-adapter`) vào `NotificationGateway`.

---

## Thứ tự Implementation

1. **Install packages** — thêm `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` (BE) và `socket.io-client` (FE)
2. **Prisma schema** — thêm 3 models, chạy `prisma migrate dev`
3. **Domain layer** — entities, value objects, repository interfaces
4. **Infrastructure repos** — Prisma repos + in-memory repos + mapper
5. **NotificationGateway** — WebSocket gateway với JWT auth + room join + `emitToRecipient()`
6. **Application** — use-cases + NotificationTargetResolverService (inject Gateway vào SendNotificationUseCase)
7. **Presentation (BE)** — Admin controller + User controller + AdminFeature
8. **Module** — `notification.module.ts` (register Gateway) + import vào `app.module.ts`
9. **Frontend types & service** — types/index.ts, notification.service.ts
10. **Frontend hooks** — useMyNotifications, useUnreadCount, useSendNotification, useNotificationSocket, …
11. **Frontend components** — NotificationBell (dùng useNotificationSocket), NotificationDropdown, NotificationPage, SendNotificationModal
12. **Router & layout** — thêm routes, nhúng NotificationBell vào MainLayout

---

## Verification

```bash
# Backend
cd be-base
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npx prisma migrate dev --name add-notification-module
npm run build                 # tsc compile, zero errors
npm test                      # unit tests pass
npm run start:dev             # khởi động server

# Frontend
cd fe-base-admin
npm install socket.io-client
npm run type-check             # TypeScript strict, zero errors
npm run lint                   # ESLint pass
npm run dev                    # Dev server port 5173

# End-to-end test (manual)
# 1. Đăng nhập fe-admin → NetworkTab kiểm tra WebSocket kết nối ws://localhost:3000/notifications
# 2. Mở 2 tab admin khác nhau
# 3. Tab 1: gửi POST /admin/notifications {"targets":[{"kind":"broadcast"}]}
# 4. Tab 2: NotificationBell badge tăng + Toast hiện tức thì (không cần reload)
```
