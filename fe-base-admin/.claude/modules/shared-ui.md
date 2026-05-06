# Shared UI & Patterns

## DataTable (`@shared/components/ui/data-table`)

Component mạnh nhất trong shared — dùng cho mọi list page. Import:
```ts
import { DataTable, useDataTable, type ColumnDef, type DataTableConfig } from '@shared/components/ui/data-table'
```

### Server-side mode (khuyến nghị)
```tsx
function MyPage() {
  const table = useDataTable<MyRow>({
    tableId: 'my-table',       // bắt buộc để persist/syncToUrl
    showSearch: true,
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  const { data, isLoading, refetch } = useMyQuery(
    table.buildQueryParams(['email', 'name']),  // searchBy fields khớp với BE
  )

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      loading={isLoading}
      table={table}
      total={data?.meta.totalItems}   // có total → kích hoạt server-side mode
      onRefresh={refetch}
      rowKey="id"
    />
  )
}
```

### Client-side mode
Không truyền `total` — DataTable tự filter/sort/paginate trên `data` prop.

### Filter inputs có sẵn
`text`, `select`, `multi-select`, `boolean`, `date`, `date-range`, `datetime`, `number`, `number-range`

### buildQueryParams → NestjsPaginateParams
`table.buildQueryParams(searchByFields)` trả về object truyền thẳng vào service call để build query string cho `nestjs-paginate`.

---

## Shared UI Components (`src/shared/components/ui/`)

### Form
| Component | Mô tả |
|---|---|
| `Button` | Primary, secondary, ghost, destructive variants |
| `Input` | Text input |
| `InputGroup` | Input với icon/addon left/right |
| `Label` | Form label |
| `Select` | Dropdown select (Radix UI) |
| `Checkbox` | Checkbox |
| `Textarea` | Multi-line input |
| `InputOTP` | OTP input |
| `Field` | Form field wrapper: label + input + error message |

### Layout & Display
| Component | Mô tả |
|---|---|
| `Card`, `CardHeader`, `CardContent` | Container |
| `Badge` | Status badge |
| `Avatar` | User avatar |
| `Separator` | HR line |
| `Tabs` | Tab navigation |
| `Accordion` | Collapsible sections |
| `StatCard` | Metric card (số + label + trend) |
| `Empty` | Empty state placeholder |
| `Skeleton` | Loading skeleton |
| `Spinner` | Loading spinner |
| `Progress` | Progress bar |

### Overlays
| Component | Mô tả |
|---|---|
| `Dialog` + `DialogContent` | Modal dialog |
| `ConfirmDialog` | Confirm action dialog (wrap Dialog) |
| `Drawer` | Side drawer |
| `Sheet` | Slide-over panel |
| `DropdownMenu` | Dropdown action menu |
| `Popover` | Floating popover |
| `Tooltip` | Hover tooltip |
| `HoverCard` | Hover info card |

### Navigation
| Component | Mô tả |
|---|---|
| `Breadcrumb` | Breadcrumb navigation |
| `Pagination` | Page nav |
| `ButtonGroup` | Grouped buttons |

### Utility
| Component | Mô tả |
|---|---|
| `PageLoader` | Full-page loading spinner |
| `ErrorBoundary` | Error boundary wrapper |
| `DataTable` | Table với filter/sort/paginate |
| `Kbd` | Keyboard shortcut display |

---

## Shared Hooks (`src/shared/hooks/`)
- `useDebounce(value, delay)` — debounce input search
- `useDisclosure()` → `{ open, onOpen, onClose, onToggle }` — modal/dialog state
- `useLocalStorage(key, defaultValue)` — typed localStorage

---

## Shared Utils (`src/shared/utils/`)
- `cn(...classes)` — clsx + tailwind-merge
- `formatDate(date, format?)` — dùng `DATE_FORMAT` constants
- `formatNumber(n)` — số với separator
- `cleanPayload(obj)` — loại bỏ undefined/null fields trước khi gửi API
