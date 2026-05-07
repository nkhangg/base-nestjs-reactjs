# Module: shared UI

shadcn/ui components và layouts dùng chung.

## UI Components (`src/shared/components/ui/`)

Tất cả components đều có `'use client'` directive. Import qua index:

```typescript
import { Button, Dialog, Input, Select, ... } from '@shared/components/ui'
```

| Component | Mô tả |
|---|---|
| `button.tsx` | Button với variants: default, ghost, outline, destructive |
| `input.tsx` | Styled input |
| `dialog.tsx` | Modal dialog (Radix UI) |
| `dropdown-menu.tsx` | Dropdown menu (Radix UI) |
| `popover.tsx` | Popover (Radix UI) |
| `select.tsx` | Select dropdown (Radix UI) |
| `tabs.tsx` | Tabs (Radix UI) |
| `card.tsx` | Card container |
| `badge.tsx` | Badge/chip |
| `separator.tsx` | Horizontal divider |
| `spinner.tsx` | Loading spinner |
| `skeleton.tsx` | Skeleton loading |
| `sonner.tsx` | Toast (Sonner, dùng next-themes) |
| `confirm-dialog.tsx` | Confirm dialog với cancel/confirm buttons |
| `error-boundary.tsx` | React error boundary |
| `page-loader.tsx` | Full-page loading state |
| `empty.tsx` | Empty state placeholder |

## Layouts (`src/shared/layouts/`)

| Layout | Dùng cho | Group |
|---|---|---|
| `PublicLayout` | Marketing pages | `(public)/` + root `page.tsx` |
| `AuthLayout` | Auth forms | `(auth)/` |
| `AppLayout` | Protected app pages (sidebar) | `(app)/` |
| `LearningLayout` | Full-screen learning | `(learning)/` |

## Hooks (`src/shared/hooks/`)

```typescript
import { useDebounce, useDisclosure, useLocalStorage } from '@shared/hooks'
```

| Hook | Mô tả |
|---|---|
| `useDebounce(value, delay)` | Debounce value |
| `useDisclosure(defaultOpen?)` | Toggle open/close state |
| `useLocalStorage(key, initial)` | localStorage với prefix `app_` |

## Utils (`src/shared/utils/`)

```typescript
import { cn, formatDate, formatNumber, cleanPayload } from '@shared/utils'
```

| Util | Mô tả |
|---|---|
| `cn(...classes)` | Merge Tailwind classes (clsx + twMerge) |
| `formatDate(value, format?)` | date-fns format |
| `formatNumber(value, locale?)` | Intl.NumberFormat |
| `cleanPayload(obj)` | Strip undefined/null/'' trước khi gửi API |
