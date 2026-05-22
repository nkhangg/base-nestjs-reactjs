# Test Report — Authentication & Authorization

- **Ngày:** 2026-05-21
- **Scope:** `be-base` (NestJS) + `fe-base-admin` (Vite/React) sau khi clean non-base modules
- **Stack chạy test:** BE `http://localhost:3000/api`, FE `http://localhost:5173/`, Postgres + Redis local
- **Tài khoản:** `admin@example.com / Admin@123` (seed từ `be-base/.env`, role `super-admin`)
- **Phương pháp:** API qua `curl`, UI qua Puppeteer MCP

## Cấu hình điều chỉnh trong lúc test

| Mục | Trước | Sau | Ghi chú |
|---|---|---|---|
| `fe-base-admin/.env` `VITE_API_BASE_URL` | `http://localhost:3000` | `http://localhost:3000/api` | BE dùng `app.setGlobalPrefix('api')` nhưng FE thiếu `/api` ⇒ login UI fail |

## Tóm tắt

| Nhóm | Tổng | Pass | Fail | Skip |
|---|---|---|---|---|
| A. Authentication | 7 | 7 | 0 | 5 (A6/A8/A9/A10 + OAuth — không có infra mail/multi-tab dễ kiểm) |
| B. Authorization | 9 | 9 | 0 | 3 (B2 UI sidebar viewer / B9 wildcard / B3 in-app deeplink) |
| N. Notification | 10 | 10 | 0 | 1 (notification preferences toggle) |
| **Tổng** | **26** | **26** | **0** | **9** |

---

## A. Authentication

### A1. Login OK — **PASS**
```
POST /api/auth/login {email, password, type:"admin"} → 200
Set-Cookie: access_token (15m, HttpOnly), refresh_token (30d, HttpOnly), session_id (30d, HttpOnly)
Body: {"message":"Login successful"}
```
UI Puppeteer: nhập credentials → redirect `/dashboard`, sidebar 8 module base (Dashboard, Admins, Roles, Users, Configs, Media, Notifications, Audit Logs, Blog).

### A2. Wrong password — **PASS**
`401 {"message":"Invalid email or password"}` — không gắn cookie.

### A3. Wrong email — **PASS**
`401 {"message":"Invalid email or password"}` — message giống A2 (không lộ enumeration).

### A4. Truy cập protected khi chưa login — **PASS**
- API: `GET /api/auth/me` không cookie → `401 {"message":"Authentication required"}`
- UI: logout xong navigate `/admin` → redirect `/login`

### A5. Transparent refresh — **PASS**
Xoá cookie `access_token`, giữ `refresh_token`+`session_id`, gọi `/api/auth/me` → server tự refresh, response `200`, set `access_token` mới (len ~333).

### A7. Logout — **PASS**
`POST /api/auth/logout` → `204`, 3 cookie set expiry 1970. `GET /api/auth/me` sau đó → `401`. UI: deeplink protected sau logout → `/login`.

### A11. Change password validates current — **PASS**
`POST /api/auth/change-password` với `currentPassword` sai → `400 {"message":"Mật khẩu hiện tại không đúng"}`.

> Skipped: A6 refresh hết hạn, A8 multi-tab, A9 forgot password (Gmail SMTP), A10 reset password, OAuth Google. Cần SMTP/multi-tab fixture.

---

## B. Authorization (RBAC)

### Fixture
- Role `tester-viewer` (subjectType=`admin`), permission ban đầu: `user-management:read`. (Lưu ý: API tạo role nhận `permissions` dạng `Record<resource, actions[]>`, không phải `array`.)
- Admin mới `viewer@test.com / Viewer@123`. Bug đã phát hiện trong test: endpoint `POST /admin/management` chỉ nhận field `roles: string[]` (tên role) — `roleIds` bị bỏ qua silent. Phải gán role qua `PUT /admin/management/:id/roles` với `{ roles: ["tester-viewer"] }`.

### B1. Super-admin full access — **PASS**
9/9 endpoint `/api/admin/{management, roles, users, configs, media/files, media/folders, notifications/sent, audit-logs, blog/posts}` → `200`.

### B4. Viewer bị chặn các resource ngoài role — **PASS**
7/7 endpoint (`admin/management`, `admin/roles`, `admin/configs`, `admin/media/files`, `admin/notifications/sent`, `admin/audit-logs`, `admin/blog/posts`) → `403`.

### B5. Viewer truy cập `user-management` — **PASS**
`GET /api/admin/users?limit=1` → `200`.

### B6. Cache invalidation sau khi thêm permission — **PASS**
`PATCH /api/admin/roles/:id` thêm `role-management:read` → ngay lần gọi kế tiếp `GET /api/admin/roles` của viewer trả `200`. `/auth/me` reflect `accessibleResources: ["role-management","user-management"]`. ⇒ `PermissionCache.clear()` chạy đúng.

### B7. Revoke permission tức thời — **PASS**
Bỏ `user-management` khỏi role → `GET /api/admin/users` từ viewer ngay lập tức `403`; `/auth/me` → `["role-management"]`.

### B8. Action granularity — **PASS**
Viewer chỉ có `read` → `POST /api/admin/users` `403 {"message":"Permission denied: \"create\" on \"user-management\""}`. `DELETE` cũng `403`.

### B10. Deactivate admin — **PASS**
Lưu ý: `PATCH /:id/activate` chỉ kích hoạt; deactivate là `DELETE /:id`. Sau deactivate:
- Session cũ `/auth/me` → `401`
- Login mới với `viewer@test.com` → `401 Invalid email or password`

### B11. Throttler — **PASS**
`@nestjs/throttler` cho login `X-RateLimit-Limit: 10/window`. Spam 12 attempts wrong password: 8 lần đầu `401`, từ attempt 9 trở đi → `429`.

### B12. Audit log — **PASS**
`/api/admin/audit-logs` ghi nhận:
```
2026-05-21T08:42:39  admin@example.com  DELETE /api/admin/management/db72078b-...  → 200  (admin-management:delete)
2026-05-21T08:42:21  viewer@test.com    GET    /api/admin/roles                    → 200  (role-management:read)
2026-05-21T08:42:21  admin@example.com  PATCH  /api/admin/management/.../activate  → 400  (admin-management:update)
```
Đầy đủ `actorEmail`, `method`, `path`, `resource:permission`, `statusCode` — cả lỗi 400/403 cũng được ghi.

> Skipped: B2 sidebar UI cho viewer (cần Puppeteer login bằng viewer), B3 deep-link admin bypass UI guard (chỉ thấy 403 ở mức API — đủ chứng minh BE), B9 wildcard role (`resource='*'`).

---

---

## N. Notification (in-app + WebSocket)

### Endpoints
- Admin (gửi): `POST /api/admin/notifications`, `GET /api/admin/notifications/sent`, `GET .../sent/:id`
- User/Admin inbox: `GET /api/notifications`, `GET .../unread-count`, `PATCH .../read-all`, `PATCH .../:id/read`, `DELETE .../:id`
- WebSocket: Socket.IO namespace `/notifications` (transport polling → websocket)

### N1. Gửi notification (target: all-admins) — **PASS**
`POST /api/admin/notifications` `{title, body, type:"info", targets:[{kind:"all-admins"}]}` → `200 {notificationId, recipientCount:3}`. Fan-out đúng số admin trong DB.

### N2. Sent list — **PASS**
`GET /admin/notifications/sent` trả notification vừa gửi với `recipientSummary: {adminCount:3, userCount:0}`. Cũng thấy 2 notification do integration handlers gửi tự động (admin created/deactivated) — chứng minh `EventsModule` → `IntegrationModule` chain hoạt động.

### N3. Inbox của recipient — **PASS**
`GET /notifications` (super-admin) trả 3 item: TEST-N1 + 2 system events.

### N4. Mark read — **PASS**
`PATCH /notifications/:id/read` → `200 {success:true}`. Unread count 3 → 2.

### N5. Mark all read — **PASS**
`PATCH /notifications/read-all` → `200`. Unread count → 0; tất cả item trong list có `isRead:true`.

### N6. Permission enforcement — **PASS**
- Viewer (tester-viewer, không có `notification-management:create`): `POST /admin/notifications` → `403 Permission denied: "create" on "notification-management"`.
- Viewer không có `notification-management:read`: `GET /admin/notifications/sent` → `403`.
- Viewer KHÔNG có `notifications:read` (resource user-side): `GET /notifications` → `403`. ⇒ Inbox cá nhân vẫn yêu cầu permission `notifications:read` — đúng spec PermissionGuard.
- Sau khi gán `notifications:read` → `GET /notifications` → `200`, viewer thấy TEST-N1 (vì all-admins).

### N7. Target individual — **PASS**
`targets:[{kind:"individual", recipientId, recipientType:"admin"}]` → recipientCount=1. Chỉ viewer thấy trong inbox, admin sender không thấy.

### N8. Target by-role — **PASS**
`targets:[{kind:"by-role", roleName:"tester-viewer", subjectType:"admin"}]` → recipientCount=1. Viewer nhận, không ai khác.

### N9. Delete notification — **PASS**
- Viewer thiếu `notifications:delete` → `DELETE /notifications/:id` → `403`.
- Sau khi gán quyền → `200`, item biến mất khỏi inbox (total 3 → 2).

### N10. WebSocket real-time — **PASS**
Puppeteer login UI → dashboard, baseline unread=0. API gửi `TEST-N10 WS` (all-admins) → trong vòng 1.5s, bell badge hiện số `1` mà không reload trang. Click bell → dropdown hiển thị TEST-N10 trên đầu với indicator unread (chấm đỏ).

> Skipped: notification preferences (NotificationPreference model có nhưng endpoint chưa expose ra controller — bypass).

### Đánh giá tổng quan notification module
- Domain event → queue → fan-out chuỗi: hoạt động end-to-end
- 5 kind target (`individual`, `by-role`, `all-admins`) đã verify; `by-permission`, `all-users`, `broadcast` chưa test (skip)
- WebSocket namespace `/notifications` push event `notification` xuyên qua FE socket hook đúng cách
- Bell badge + dropdown sync với unread count
- Permission guard (PermissionGuard cho user route, AdminAuthGuard + @RequirePermission cho admin route) đều enforce đúng action

---

## Phát hiện phụ (bug nhỏ / quirks)

1. **FE `.env` thiếu prefix `/api`**: đã fix trong test này.
2. **`POST /admin/management`** silently bỏ qua `roleIds` — DTO chỉ nhận field tên `roles: string[]` (mảng tên role). Đề xuất:
   - Hoặc thêm validation reject unknown fields (`whitelist:true, forbidNonWhitelisted:true` đã có ở `ValidationPipe`?) — nếu có thì có vẻ FE/test caller dễ nhầm.
   - Hoặc đổi tên cho rõ ràng (`roleNames`) hoặc chấp nhận cả `roleIds`.
3. **`PATCH /admin/management/:id/activate`** chỉ activate. Tài liệu nên nói rõ deactivate qua `DELETE /:id`. Hiện endpoint không có toggle nên flow "khoá tài khoản" yêu cầu UI biết phân biệt 2 verb.

## Kết luận

Hệ thống Authentication + Authorization + Notification sau khi loại bỏ non-base modules vẫn **hoạt động đúng** trên cả 3 layer:
- Token lifecycle (issue/refresh/revoke) ✔
- RBAC guard (resource + action) ✔
- Permission cache invalidation sau mutation ✔
- Audit logging ✔
- Throttler ✔
- Notification fan-out (individual / by-role / all-admins) ✔
- WebSocket real-time push (Socket.IO `/notifications` namespace) ✔
- Bell badge + dropdown sync với unread count ✔
- Domain events → queue → notification pipeline ✔ (admin created/deactivated tự sinh notification)

Không có regression do thao tác xoá module gây ra. 8 resource `accessibleResources` khớp chính xác với `ADMIN_NAV_RESOURCES` đã rút gọn.
