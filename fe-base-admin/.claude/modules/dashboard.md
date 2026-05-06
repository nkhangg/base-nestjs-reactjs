# Module: modules/dashboard

## Mục đích
Trang chủ sau đăng nhập. Hiển thị health check backend + stats tổng quan.

## Cấu trúc
```
modules/dashboard/
├── components/
│   └── DashboardPage.tsx      # Stats cards + health status
├── hooks/
│   └── useHealthCheck.ts      # useHealth (query)
├── services/
│   └── health.service.ts
├── types/
│   └── health.types.ts        # HealthStatus, HealthIndicator
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/dashboard` | `DashboardPage` | `AuthGuard` |

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/health` | `useHealthCheck` |

## Query Keys
`QUERY_KEYS.HEALTH`, `QUERY_KEYS.DASHBOARD.STATS`
