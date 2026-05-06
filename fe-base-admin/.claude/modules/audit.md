# Module: modules/audit

## Mục đích
Xem audit log — read-only, không có write operations. Hiển thị lịch sử actions của admins.

## Cấu trúc
```
modules/audit/
├── components/
│   └── AuditPage.tsx        # DataTable với filters: actorId, resource, permission, date range
├── hooks/
│   └── useAuditLogs.ts      # useAuditLogList (paginate + filter)
├── services/
│   └── audit.service.ts
├── types/
│   └── index.ts             # AuditLog { id, actorId, actorEmail, resource, permission, method, path, statusCode, occurredAt }
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/audit-logs` | `AuditPage` | `AdminGuard` |

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/audit-logs` | `useAuditLogList` (paginate) |

### Filter params
- `actorId` — lọc theo admin
- `resource` — lọc theo resource name
- `permission` — lọc theo action
- `dateFrom`, `dateTo` — date range

## Query Keys
`QUERY_KEYS.AUDIT_LOGS`
