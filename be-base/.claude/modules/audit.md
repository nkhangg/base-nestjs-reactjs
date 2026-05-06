# Module: modules/audit

## Mục đích
Ghi log mọi write action (POST/PATCH/DELETE) qua `AuditInterceptor` (global `APP_INTERCEPTOR`). Admin có thể xem lịch sử audit log qua paginated list.

## Cấu trúc
```
modules/audit/
├── domain/
│   ├── entities/audit-log.entity.ts   # { id, actorId, actorEmail, resource, permission, method, path, statusCode, occurredAt }
│   └── repositories/audit-log.repository.ts   # AUDIT_LOG_REPOSITORY
├── application/use-cases/
│   └── list-audit-logs.use-case.ts
├── infrastructure/
│   ├── interceptors/audit.interceptor.ts   # APP_INTERCEPTOR — tự động log write requests
│   └── repositories/prisma-audit-log.repository.ts
└── presentation/
    ├── audit-log.controller.ts    # /admin/audit-logs (AdminAuthGuard)
    └── audit-log.feature.ts
```

## API Routes (`/admin/audit-logs`)

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/audit-logs` | read (paginate) |

### Paginate filters
| Filter | Operator | Mô tả |
|---|---|---|
| `actorId` | EQ | Lọc theo người thực hiện |
| `resource` | EQ | Lọc theo resource name |
| `permission` | EQ | Lọc theo action (read/create/...) |
| `dateFrom` | EQ | Từ ngày |
| `dateTo` | EQ | Đến ngày |

Sortable columns: `occurredAt`, `resource`, `actorEmail`.

## AuditInterceptor
Đăng ký là `APP_INTERCEPTOR` (global) — intercept **sau khi response thành công**:
- Chỉ log các method: `POST`, `PATCH`, `PUT`, `DELETE`
- Đọc `req.user` để lấy `actorId`, `actorEmail`
- Đọc `@RequirePermission` metadata để lấy `resource`, `permission`
- Không log nếu request thất bại (status >= 400)
