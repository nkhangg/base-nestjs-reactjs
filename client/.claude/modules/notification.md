# Module: notification

Thông báo realtime cho người dùng — bell icon, dropdown, Socket.IO.

## Structure

```
src/modules/notification/
├── components/
│   ├── NotificationBell.tsx     # Bell icon với badge số chưa đọc, kết nối socket
│   └── NotificationDropdown.tsx # Popover list thông báo, mark read, delete
├── hooks/
│   ├── useMyNotifications.ts    # Paginated list query
│   ├── useUnreadCount.ts        # Count query (polling 60s)
│   ├── useMarkAsRead.ts         # Mark single as read
│   ├── useMarkAllAsRead.ts      # Mark all as read
│   ├── useDeleteNotification.ts # Delete notification
│   └── useNotificationSocket.ts # Socket.IO — realtime push
├── services/
│   └── notification.service.ts  # API calls (user-facing only)
├── types/
│   └── index.ts                 # NotificationType, NotificationRecipientItem, ...
└── index.ts
```

## Public API

```typescript
import {
  NotificationBell, NotificationDropdown,
  useMyNotifications, useUnreadCount,
  useMarkAsRead, useMarkAllAsRead, useDeleteNotification,
  useNotificationSocket,
} from '@modules/notification'
```

## Usage

`NotificationBell` dùng trong `AppLayout` (sidebar header):

```tsx
import { NotificationBell } from '@modules/notification'

// Trong AppLayout header:
<NotificationBell />
```

Socket tự connect khi mount `NotificationBell`, disconnect khi unmount.

## API Endpoints

| Hook/Service | Method | Endpoint |
|---|---|---|
| `useMyNotifications` | GET | `/notifications` |
| `useUnreadCount` | GET | `/notifications/unread-count` |
| `useMarkAsRead` | PATCH | `/notifications/:id/read` |
| `useMarkAllAsRead` | PATCH | `/notifications/read-all` |
| `useDeleteNotification` | DELETE | `/notifications/:id` |

## Socket

```
Namespace: /notifications
Events:
  connect → invalidate LIST + UNREAD_COUNT
  notification (SocketNotificationPayload) → toast.info + invalidate
```

## Query Keys

```typescript
QUERY_KEYS.NOTIFICATIONS.LIST          // ['notifications', 'list']
QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT  // ['notifications', 'unread-count']
```
