# Module: modules/notification

## Mục đích
In-app notifications với real-time WebSocket. Admin gửi và xem lịch sử; tất cả user nhận qua bell icon + dropdown + trang notifications.

## Cấu trúc
```
modules/notification/
├── components/
│   ├── NotificationBell.tsx       # Bell icon với unread badge (header)
│   ├── NotificationDropdown.tsx   # Dropdown list + mark as read
│   ├── NotificationPage.tsx       # Full page: my notifications + sent list (admin)
│   ├── SendNotificationModal.tsx  # Admin: compose + send notification
│   └── RecipientPicker.tsx        # Chọn target: individual / role / broadcast
├── hooks/
│   ├── useNotificationSocket.ts   # WebSocket connection + auto-invalidate queries
│   ├── useMyNotifications.ts      # List nhận được (paginate)
│   ├── useUnreadCount.ts          # Số chưa đọc
│   ├── useMarkAsRead.ts
│   ├── useMarkAllAsRead.ts
│   ├── useDeleteNotification.ts
│   ├── useSendNotification.ts     # Admin: gửi notification
│   └── useSentNotifications.ts    # Admin: list đã gửi (paginate)
├── services/
│   └── notification.service.ts
├── types/
│   └── index.ts                   # Notification, NotificationTarget, SocketNotificationPayload
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/notifications` | `NotificationPage` | `AdminGuard` |

## WebSocket — `useNotificationSocket`
```ts
// Mount trong MainLayout để lắng nghe notification real-time:
useNotificationSocket()

// Kết nối:
io(`${API_BASE_URL}/notifications`, {
  withCredentials: true,
  transports: ['polling', 'websocket'],  // polling trước để gửi cookie qua HTTP
})

// Events lắng nghe:
socket.on('notification', payload => {
  invalidateQueries(NOTIFICATIONS.LIST)
  invalidateQueries(NOTIFICATIONS.UNREAD_COUNT)
  toast.info(payload.title, { description: payload.body })
})
socket.on('connect', () => {
  // sync lại count + list sau reconnect
})
```
**Lưu ý:** `transports: ['polling', 'websocket']` — thứ tự này bắt buộc để initial handshake gửi cookie qua HTTP trước khi upgrade WS.

## API Endpoints

### User (nhận)
| Method | Path | Hook |
|---|---|---|
| GET | `/notifications` | `useMyNotifications` |
| GET | `/notifications/unread-count` | `useUnreadCount` |
| PATCH | `/notifications/:id/read` | `useMarkAsRead` |
| PATCH | `/notifications/read-all` | `useMarkAllAsRead` |
| DELETE | `/notifications/:id` | `useDeleteNotification` |

### Admin (gửi)
| Method | Path | Hook |
|---|---|---|
| POST | `/admin/notifications` | `useSendNotification` |
| GET | `/admin/notifications` | `useSentNotifications` |
| GET | `/admin/notifications/:id` | `useSentNotificationDetail` |

## Query Keys
`QUERY_KEYS.NOTIFICATIONS.LIST`, `QUERY_KEYS.NOTIFICATIONS.UNREAD_COUNT`, `QUERY_KEYS.NOTIFICATIONS.SENT`
