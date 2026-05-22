# Test Plan — Notification Management

- **Ngày lập:** 2026-05-21
- **Scope:** `be-base` (NestJS) + `fe-base-admin` (Vite/React) + `client` (storefront)
- **Tham chiếu báo cáo trước:** `planning/test-report-auth-2026-05-21.md` (mục N1–N10, 10/11 PASS)
- **Mục tiêu:** Bao phủ các nhánh chưa được kiểm thử + regression cho các case đã PASS, cộng UI flow của bell/dropdown/modal trên cả admin portal lẫn client storefront.

---

## 0. Bối cảnh & cấu trúc module

### Endpoints
**Admin (notification-management)** — `AdminAuthGuard` + `@RequirePermission`:
| Method | Path | Permission | Mô tả |
|---|---|---|---|
| `GET`   | `/api/admin/notifications/unread-count` | — (chỉ cần login admin) | Đếm thông báo chưa đọc của admin hiện tại |
| `POST`  | `/api/admin/notifications`              | `create` | Gửi notification |
| `GET`   | `/api/admin/notifications/sent`         | `read`   | List đã gửi (nestjs-paginate: search, type, createdAt BTW, sort) |
| `GET`   | `/api/admin/notifications/sent/:id`     | `read`   | Detail + recipient list |

**User-side (notifications)** — `PermissionGuard` + `@Permission`:
| Method | Path | Permission | Mô tả |
|---|---|---|---|
| `GET`    | `/api/notifications/unread-count` | `notifications:read`   | Unread count của user/admin hiện tại |
| `GET`    | `/api/notifications`              | `notifications:read`   | Inbox (paginate, filter `isRead`, search) |
| `PATCH`  | `/api/notifications/:id/read`     | `notifications:update` | Mark single read |
| `PATCH`  | `/api/notifications/read-all`     | `notifications:update` | Mark all read |
| `DELETE` | `/api/notifications/:id`          | `notifications:delete` | Soft delete |

**WebSocket:** namespace `/notifications` (Socket.IO), auth via cookie `access_token` hoặc `handshake.auth.token`. Token expired vẫn cho join room (chỉ nhận push, không có write). Room: `${recipientType}:${recipientId}`.

### Target kinds (6 loại)
`individual` · `by-role` · `by-permission` · `all-users` · `all-admins` · `broadcast`. Báo cáo cũ đã test `individual`, `by-role`, `all-admins`. **Plan này test thêm `by-permission`, `all-users`, `broadcast`.**

### FE surface area
- **fe-base-admin:** `NotificationBell`, `NotificationDropdown`, `NotificationPage` (DataTable + sent list), `SendNotificationModal` (Zod schema: title/body required, 5 type, 5 targetMode), `RecipientPicker`.
- **client:** `NotificationBell`, `NotificationDropdown`, hooks `useMyNotifications/useUnreadCount/useMarkAsRead/useMarkAllAsRead/useDeleteNotification/useNotificationSocket` — KHÔNG có trang quản lý gửi (chỉ là consumer).

---

## 1. Fixture chuẩn bị

| Item | Cách tạo | Ghi chú |
|---|---|---|
| Super-admin | seed sẵn `admin@example.com / Admin@123` | Có toàn quyền |
| Admin viewer | tái dùng `viewer@test.com / Viewer@123` từ test cũ — nếu đã deactivate (B10), tạo lại | Role `tester-viewer` |
| Role `tester-viewer` | permissions: `notification-management:read` thôi (gắn/bỏ động khi cần) | Kiểm tra cache invalidation |
| User end-customer | seed `user@example.com / User@123` qua `POST /api/admin/users` | Cần để test target `all-users`, `broadcast`, client storefront |
| 2 admin phụ | tạo qua `POST /api/admin/management` (role nào cũng được) | Để verify `by-role`, `by-permission` ra > 1 ID |
| Redis + Postgres | local, đã chạy | EventsModule + QueueModule cần Redis |
| SMTP | không bắt buộc (notification in-app, không gửi mail) | — |

**Pre-flight:**
```bash
# BE
cd be-base && npm run start:dev   # port 3000, prefix /api
# FE
cd fe-base-admin && npm run dev   # port 5173
# Client
cd client && npm run dev          # port 3001 (kiểm tra .env)
```

**Reset state giữa các case:** `DELETE /api/notifications/:id` cho recipient đã đọc, hoặc dùng tài khoản phụ để tránh nhiễu inbox của super-admin.

---

## 2. Test matrix

| Nhóm | Mã | Mô tả ngắn | Layer | Ưu tiên |
|---|---|---|---|---|
| **A. Send — target kinds** | A1–A6 | 6 kind: individual, by-role, by-permission, all-users, all-admins, broadcast | API | P0 |
| **B. Send — DTO validation** | B1–B5 | Empty title/body, type invalid, targets non-array, unknown kind | API | P0 |
| **C. Send — concurrency & idempotency** | C1–C2 | Gửi 2 request song song, recipient dedup khi list targets trùng | API | P1 |
| **D. Sent list — pagination/search/filter/sort** | D1–D6 | Page, limit, search, filter type, filter createdAt BTW, sortBy | API | P0 |
| **E. Sent detail** | E1–E3 | OK, 404, recipientSummary đúng | API | P1 |
| **F. Inbox list — paginate + filter isRead + search** | F1–F4 | Default, ?isRead=true/false, search, page 2 | API | P0 |
| **G. Mark read** | G1–G4 | Single, all, idempotent (mark read 2 lần), cross-user (mark recipient của người khác) | API | P0 |
| **H. Delete** | H1–H3 | Soft-delete, idempotent, cross-user | API | P0 |
| **I. Unread count** | I1–I3 | Sau send/read/delete đều update đúng | API | P0 |
| **J. WebSocket** | J1–J5 | Connect cookie, connect handshake.auth, no-token disconnect, expired-token room-join, reconnect | WS | P0 |
| **K. Realtime fan-out** | K1–K3 | Push tới đúng room, không bleed sang room khác, push khi by-role | WS | P0 |
| **L. Permission enforcement** | L1–L8 | Admin create/read missing, user read/update/delete missing, cross-actor mark read | API | P0 |
| **M. System integration events** | M1–M2 | Admin created → notification auto, admin deactivated → notification auto | Event→Queue→Notify | P1 |
| **N. Audit log** | N1–N2 | Mọi mutation (`POST/PATCH/DELETE`) có log | API | P1 |
| **O. FE — admin form (SendNotificationModal)** | O1–O7 | Validation zod, 5 targetMode, RecipientPicker bắt buộc khi specific, reset sau submit | UI (Puppeteer) | P0 |
| **P. FE — admin sent page (NotificationPage)** | P1–P5 | Render list, sort, filter type, filter date-range, search | UI | P1 |
| **Q. FE — bell + dropdown (admin)** | Q1–Q5 | Badge, dropdown items, mark-as-read click, mark-all, real-time push | UI | P0 |
| **R. Client — bell + dropdown** | R1–R4 | User nhận notification, mark read, delete, WS push | UI (client) | P0 |
| **S. Cross-cutting regression** | S1–S2 | Role-based UI hiding nút "Gửi thông báo" khi không có permission; cache permission invalidation | UI + API | P1 |

---

## 3. Chi tiết test case

### A. Send — target kinds

> Format chung: `POST /api/admin/notifications` `{title, body, type:'info', targets:[...]}`. Verify response `{success:true, data:{notificationId, recipientCount}}`. Crosscheck inbox của recipient.

- **A1 Individual** — `targets:[{kind:'individual', recipientId:<viewerId>, recipientType:'admin'}]` → `recipientCount=1`. Only viewer thấy trong `/notifications`. (Đã PASS — regression).
- **A2 By-role** — role `tester-viewer` có 1 admin assigned → `recipientCount=1`. Gán thêm 1 admin nữa vào role → gửi lại → `recipientCount=2`. Sender (super-admin) không thấy (vì không assign role này).
- **A3 By-permission** — `targets:[{kind:'by-permission', resource:'notification-management', action:'read', subjectType:'admin'}]`. Verify `recipientCount` = số admin có quyền đó (super-admin + bất kỳ admin nào được gán role có `notification-management:read`). Add/remove permission → re-send → count thay đổi tương ứng. **Lưu ý:** cần verify cả wildcard role nếu có (`resource='*'`).
- **A4 All-users** — tạo trước 3 user qua `/api/admin/users`. Gửi `all-users` → `recipientCount=3`. Admin KHÔNG có trong recipient. Một user login storefront → inbox có notification.
- **A5 All-admins** — `recipientCount` = số admin active (đã cover N1, lưu ý nếu có admin deactivated thì có nằm trong fan-out không — kỳ vọng dùng `findAll` không filter `isActive` → có; nên cross-check & note rủi ro).
- **A6 Broadcast** — `recipientCount` = #admin + #user. User login storefront thấy; admin portal thấy.

### B. Send — DTO validation

- **B1** title='' → 400 `Mật khẩu...` không, mà phải là class-validator error `title should not be empty`.
- **B2** body='' → 400.
- **B3** type='bogus' → 400 (whitelist enum).
- **B4** targets='not-an-array' → DTO `@Transform` ép về `[]` → resolve ra 0 recipient → `recipientCount=0`. **Quyết định:** đây có phải edge case nên reject thay vì im lặng? Nếu nghiệp vụ muốn cấm 0-recipient, ghi nhận bug để discuss.
- **B5** targets có item `{kind:'unknown'}` → resolver skip → trường hợp 1-target unknown trả `recipientCount=0`. Verify không crash, notification record vẫn được save (orphan). **Đề xuất:** test này phơi ra rủi ro nếu mọi target bị skip thì vẫn save notification empty — cân nhắc reject ở DTO layer.

### C. Concurrency & idempotency

- **C1** Gửi 5 request song song (curl `&`) cùng nội dung tới `all-admins` → 5 notification record + 5×N recipient. Không có race condition (kiểm tra DB count).
- **C2** `targets:[{individual:viewerId,admin},{individual:viewerId,admin},{kind:'all-admins'}]` → viewer chỉ nhận 1 recipient row (dedup theo `Set seen`). `recipientCount` = số admin distinct.

### D. Sent list

- **D1 Default** — `GET /api/admin/notifications/sent` → 200, default limit 20, sort desc createdAt (xác nhận tài liệu, hiện code không set defaultSortBy — verify thực tế).
- **D2 Pagination** — gửi 25 notification → `?page=2&limit=10` → 10 item kế tiếp; meta.totalItems=25.
- **D3 Search** — `?search=TEST-ALPHA` chỉ match title/body chứa `TEST-ALPHA` (config searchableColumns).
- **D4 Filter type** — `?filter.type=alert` → chỉ trả type=alert.
- **D5 Filter createdAt BTW** — `?filter.createdAt=$btw:2026-05-20T00:00:00.000Z,2026-05-22T00:00:00.000Z` → đúng khoảng.
- **D6 SortBy** — `?sortBy=createdAt:ASC` đảo thứ tự; `?sortBy=type:DESC` sort theo type.

### E. Sent detail

- **E1** `GET /sent/:id` valid → 200, payload có `senderEmail` (nếu sender là admin), `recipients: [{id, recipientId, recipientType, isRead, readAt, createdAt}]`.
- **E2** `GET /sent/00000000-0000-0000-0000-000000000000` → 404 `Notification not found`.
- **E3** Sau khi 2/3 recipient đã đọc → `recipientSummary` vẫn show `{adminCount, userCount}` đầy đủ, không phụ thuộc isRead.

### F. Inbox list (user-side)

- **F1** Default super-admin → 200, item gần nhất trên đầu.
- **F2** `?filter.isRead=false` → chỉ chưa đọc.
- **F3** `?filter.isRead=true` → chỉ đã đọc.
- **F4** Trang 2 với limit 5, total > 5.

### G. Mark read

- **G1** `PATCH /:id/read` recipient hợp lệ → 200, lần 2 cùng id → vẫn 200 (idempotent, readAt giữ nguyên — verify implementation).
- **G2** `PATCH /read-all` → 200, mọi item isRead=true.
- **G3** Cross-actor: viewer cố mark read 1 recipient của super-admin → 403 hoặc 404 (đọc use-case `mark-as-read.use-case.ts` để xác định error code).
- **G4** Read sau khi recipient bị soft-delete → 404.

### H. Delete

- **H1** `DELETE /:id` recipient của chính mình → 200, item biến mất khỏi list.
- **H2** Lần 2 cùng id → 404 (đã soft-delete).
- **H3** Cross-actor → 403/404.

### I. Unread count

- **I1** Sau A1/A2 → count tăng đúng.
- **I2** Mark all read → count = 0.
- **I3** Sau delete unread item → count giảm 1.

### J. WebSocket auth

Dùng `socket.io-client` hoặc puppeteer thật.
- **J1** Connect with cookie hợp lệ → join room `admin:<id>`.
- **J2** Connect with `handshake.auth.token=<accessToken>` → join room.
- **J3** Connect không có token → disconnect ngay.
- **J4** Token expired (mock bằng cách sleep + manually expired) → vẫn join (theo code, fallback `verifyAccessTokenIgnoreExpiry`). Log debug `WS: expired token accepted`.
- **J5** Sau disconnect → reconnect → vẫn nhận push của notification mới (room mới được join).

### K. Realtime fan-out

- **K1** 2 admin connect WS. Gửi `individual` tới admin A → chỉ admin A nhận event `notification`; admin B không nhận.
- **K2** Gửi `by-role` với role chỉ có 1 admin → chỉ 1 socket nhận. Admin connect với 2 tab → cả 2 tab cùng room nhận (Socket.IO broadcast tới room).
- **K3** Gửi `broadcast` → cả user (storefront WS) và admin (portal WS) đều nhận. Verify event payload: `{id, type, title, body, data, createdAt}`.

### L. Permission enforcement

Reuse fixture viewer (role có/không quyền tương ứng).
- **L1** Viewer thiếu `notification-management:create` → `POST /admin/notifications` → 403.
- **L2** Viewer thiếu `notification-management:read` → `GET /sent` → 403.
- **L3** Viewer có `read` nhưng cố `POST` → 403 (action granularity).
- **L4** Sau khi gán `create` → `POST` thành công ngay (verify cache clear).
- **L5** Viewer thiếu `notifications:read` → `GET /notifications` → 403.
- **L6** Viewer thiếu `notifications:update` → `PATCH /:id/read` → 403.
- **L7** Viewer thiếu `notifications:delete` → `DELETE /:id` → 403.
- **L8** User storefront (role mặc định) gọi `/api/admin/notifications` → 403 (admin guard).

### M. System integration

- **M1** `POST /admin/management` tạo admin mới → vài giây sau super-admin inbox có 1 notification "Admin được tạo" (qua EventsModule → IntegrationModule → SendNotificationUseCase).
- **M2** `DELETE /admin/management/:id` → notification "Admin bị vô hiệu hóa". Verify sender = `system`, `senderEmail=null`.

### N. Audit log

- **N1** `POST /admin/notifications` → `audit-logs` có entry `notification-management:create`, method `POST`, statusCode 200/201.
- **N2** `PATCH /notifications/:id/read` từ user → entry `notifications:update` với actorEmail tương ứng.

### O. FE — SendNotificationModal (Puppeteer)

Login super-admin → `/notifications` → click "Gửi thông báo".
- **O1** Submit form rỗng → 2 inline error "Tiêu đề không được để trống", "Nội dung không được để trống".
- **O2** Chọn type=warning, target=`all-admins`, title/body filled → submit → modal đóng, sent list refetch có item mới (verify toast success nếu có).
- **O3** Switch target=`specific-admins` mà chưa chọn recipient → submit → error "Vui lòng chọn ít nhất 1 đối tượng".
- **O4** Mở RecipientPicker → search admin, multi-select 2 admin → submit → BE gửi `targets: [{individual,A,admin},{individual,B,admin}]` → recipientCount=2.
- **O5** Switch target mode (`specific-admins` → `specific-users`) → `recipientIds` clear (useEffect L103-105 của modal).
- **O6** Loading state: submit → button "Đang gửi…", disabled. Modal không đóng cho tới khi response về.
- **O7** Sau submit thành công, `reset()` chạy → mở modal lại form sạch (default values).

### P. FE — NotificationPage (DataTable)

- **P1** Render danh sách paginated, mỗi row có Title, Type badge (đúng variant), Recipient summary "X admin, Y user", Sender (system/email), thời gian format `dd/MM/yyyy HH:mm`.
- **P2** Sort cột "Loại" ASC/DESC → bảng reorder, URL `?sortBy=type:ASC` (syncToUrl=true).
- **P3** Filter type=alert → bảng chỉ show alert.
- **P4** Filter date-range cột "Thời gian" → BTW filter gửi BE.
- **P5** Search "TEST-ALPHA" → searchableColumns title,body match.

### Q. FE — Bell + Dropdown (admin)

- **Q1** Khi unread > 0 → bell hiển thị số badge.
- **Q2** Click bell → dropdown list mở, hiển thị tối đa N item gần nhất (đọc code Bell/Dropdown để xác định N — kỳ vọng 5-10).
- **Q3** Click một item unread → mark-as-read API call, badge giảm 1, item hết chấm đỏ.
- **Q4** Nút "Đánh dấu tất cả đã đọc" → API `PATCH /read-all`, badge = 0.
- **Q5** Khi có notification mới (gửi từ tab khác qua API) → bell badge +1 trong < 2s mà không reload (WS push).

### R. Client storefront — Bell + Dropdown

Login user qua `/login` của client.
- **R1** Gửi `all-users` từ admin portal → bell client tăng badge realtime.
- **R2** Click bell → dropdown user thấy notification.
- **R3** Mark read → badge giảm.
- **R4** Delete → item biến mất, badge cập nhật.

### S. Cross-cutting regression

- **S1** Login viewer (không có `notification-management:create`) → trang `/notifications` (nếu menu hiển thị do có `:read`) → nút "Gửi thông báo" cần ẩn (verify FE menu/permission check; nếu nút vẫn hiển thị nhưng click trả 403 thì coi đây là defect UI nhẹ).
- **S2** Bỏ permission `notifications:read` của viewer → viewer đang ở dropdown → mark-as-read action lần kế tiếp → 403, FE phải hiện toast lỗi (không silent fail).

---

## 4. Out of scope

- Notification preferences (NotificationPreference model có nhưng chưa expose controller — đã note trong report cũ).
- Email/SMS channel (notification chỉ in-app + WS).
- Push notification (web push) — chưa có infra.
- i18n nội dung notification (BE lưu raw string).
- Performance test khối lượng lớn (>10k recipients trong 1 fan-out): code dùng `pageSize: 1_000_000` cho `findAll` → đáng theo dõi nhưng plan này không stress test.

---

## 5. Quy ước báo cáo

Output sẽ ghi vào `planning/test-report-notification-2026-05-21.md` với cùng template như report auth: bảng tóm tắt PASS/FAIL/SKIP, từng case ngắn gọn, mục "Phát hiện phụ (bug nhỏ / quirks)".

### Thứ tự execute đề xuất

1. Pre-flight: dựng fixture + verify health (BE/FE/Client up, Redis/Postgres OK).
2. API API API: A → B → C → D → E → F → G → H → I → L → M → N (nhanh, dùng curl batch).
3. WS: J → K (cần socket.io-client hoặc 2 puppeteer instance).
4. UI: O → P → Q (admin Puppeteer) → R (client Puppeteer).
5. Regression: S.

### Định nghĩa PASS/FAIL

- **PASS:** kết quả khớp expectation, không có lỗi phụ.
- **FAIL:** sai expectation hoặc lỗi 500/crash; ghi rõ repro + log.
- **SKIP:** thiếu fixture/infra (ghi rõ lý do).
- **PARTIAL:** đa số nhánh PASS nhưng có edge case fail nhẹ — ghi vào "phát hiện phụ".
