# Module: dashboard

Trang tổng quan cho người học — thống kê streak, XP, từ đã thuộc, mục tiêu hôm nay.

## Structure

```
src/modules/dashboard/
├── components/
│   └── DashboardPage.tsx      # Grid stat cards
├── hooks/
│   └── useDashboard.ts        # useDashboardStats, useDashboardModules
├── services/
│   └── dashboard.service.ts   # getStats, getModules
├── types/
│   └── index.ts               # DashboardStats, LearningModule
└── index.ts
```

## Public API

```typescript
import { DashboardPage, useDashboardStats, useDashboardModules } from '@modules/dashboard'
import type { DashboardStats, LearningModule } from '@modules/dashboard'
```

## Route

| Route | Page | Group |
|---|---|---|
| `/dashboard` | `(app)/dashboard/page.tsx` | (app) — sidebar layout |

## API Endpoints

| Hook | Method | Endpoint |
|---|---|---|
| `useDashboardStats` | GET | `/dashboard/stats` |
| `useDashboardModules` | GET | `/dashboard/modules` |

## Query Keys

```typescript
QUERY_KEYS.DASHBOARD.STATS    // ['dashboard', 'stats']
QUERY_KEYS.DASHBOARD.MODULES  // ['dashboard', 'modules']
```
