# Module: billing

Trang quản lý gói đăng ký — hiển thị gói hiện tại, mức dùng, các gói nâng cấp, phương thức thanh toán, lịch sử hoá đơn, và luồng nâng cấp Pro.

## Structure

```
src/modules/billing/
├── components/
│   ├── BillingPage.tsx              # Main page (lắp ráp các section)
│   ├── CurrentPlanBanner.tsx        # Banner đen — gói hiện tại + teaser upgrade
│   ├── UsageStatsGrid.tsx           # 3 cards usage với progress bars
│   ├── UpgradePlansSection.tsx      # Toggle period + plan cards grid
│   ├── PlanCard.tsx                 # Plan card (current/highlighted variants)
│   ├── PaymentMethodsCard.tsx       # List phương thức + nút add
│   ├── BillingHistoryCard.tsx       # Table invoices + export
│   ├── CancelSubscriptionSection.tsx
│   └── UpgradeDialog.tsx            # Modal xác nhận nâng cấp
├── hooks/
│   └── useBilling.ts                # useSubscription, usePlans, useUsage, ...
├── services/
│   └── billing.service.ts           # Stubs trả mock data (TODO: thay bằng apiClient)
├── types/
│   └── index.ts                     # Subscription, Plan, UsageStat, Invoice, ...
└── index.ts                         # Barrel exports
```

## Public API

```typescript
import {
  BillingPage,
  useSubscription, usePlans, useUsage, usePaymentMethods, useInvoices, useUpgrade,
  billingService,
} from '@modules/billing'
import type {
  Subscription, Plan, UsageStat, PaymentMethod, Invoice,
  BillingPeriod, BillingPlanId, UpgradePayload,
} from '@modules/billing'
```

## Route

| Route | Group | Page file |
|---|---|---|
| `/billing` | `(app)` (AppLayout — sidebar) | `src/app/(app)/billing/page.tsx` |

## API Endpoints (mock — chưa kết nối BE)

| Method | Path | Hook |
|---|---|---|
| GET | /api/billing/subscription | `useSubscription` |
| GET | /api/billing/plans | `usePlans` |
| GET | /api/billing/usage | `useUsage` |
| GET | /api/billing/payment-methods | `usePaymentMethods` |
| GET | /api/billing/invoices | `useInvoices` |
| POST | /api/billing/subscribe | `useUpgrade` |

Hiện tại `billing.service.ts` trả mock data — đánh dấu `TODO: replace with apiClient`. Khi BE sẵn sàng chỉ cần đổi body từng method.

## Query Keys

```typescript
QUERY_KEYS.BILLING = {
  PLANS:           ['billing', 'plans'],
  SUBSCRIPTION:    ['billing', 'subscription'],
  USAGE:           ['billing', 'usage'],
  PAYMENT_METHODS: ['billing', 'payment-methods'],
  INVOICES:        ['billing', 'invoices'],
}
```

## i18n namespace

`billing.*` trong `src/shared/i18n/locales/{vi,en}.json` — chứa các sub-namespace: `usage.*`, `payment.*`, `history.*`, `cancel.*`, `dialog.*`, `teaser.*`.
