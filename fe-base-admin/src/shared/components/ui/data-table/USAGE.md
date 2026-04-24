# DataTable — Usage Guide

Import tất cả qua public API:
```ts
import { DataTable, useDataTable, type ColumnDef, type DataTableConfig } from '@shared/components/ui/data-table'
```

---

## Hai chế độ hoạt động

### 1. Server-side (khuyến nghị cho production)

Dùng khi backend xử lý filter/sort/paginate (ví dụ: nestjs-paginate).

```tsx
function MyPage() {
  const table = useDataTable<MyRow>({
    tableId: 'my-table',          // bắt buộc nếu dùng persist/syncToUrl
    showSearch: true,
    searchPlaceholder: 'Tìm...',
    showFilters: true,
    showColumnVisibility: true,
    showRefreshButton: true,
    persistPageSize: true,
    persistFilters: true,
    persistSort: true,
  })

  // table.buildQueryParams() trả về NestjsPaginateParams
  // truyền thẳng vào query hook
  const { data, isLoading, refetch } = useMyQuery(
    table.buildQueryParams(['email', 'name']),  // searchBy fields
  )

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      loading={isLoading}
      table={table}                    // pass controlled table
      total={data?.meta.totalItems}    // có total → server-side mode
      onRefresh={refetch}
      rowKey="id"
    />
  )
}
```

### 2. Client-side

Không truyền `total` — component tự filter/sort/paginate trên `data` prop.

```tsx
<DataTable
  columns={columns}
  data={localData}
  config={{
    showSearch: true,
    showFilters: true,
    searchKeys: ['name', 'email'],
  }}
/>
```

---

## Định nghĩa columns

```ts
const columns: ColumnDef<MyRow>[] = [
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    filterable: true,
    filterType: 'text',             // text | select | boolean | number | number-range
                                    // date | date-range | datetime | multi-select
  },
  {
    key: 'role',
    header: 'Role',
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
    ],
  },
  {
    key: 'isActive',
    header: 'Trạng thái',
    filterable: true,
    filterType: 'boolean',          // renders Yes/No select
  },
  {
    key: 'amount',
    header: 'Số tiền',
    filterable: true,
    filterType: 'number',
    filterOperators: ['gte', 'lte'], // nếu muốn chọn operator
  },
  {
    key: 'createdAt',
    header: 'Ngày tạo',
    sortable: true,
    filterable: true,
    filterType: 'date-range',
  },
  {
    key: 'actions',
    header: '',
    hideable: false,                // không cho ẩn cột này
    render: (_, row) => <ActionMenu row={row} />,
  },
]
```

### Tất cả options của `ColumnDef`

| Prop | Type | Mô tả |
|------|------|-------|
| `key` | `string` | dot-notation được hỗ trợ (`user.name`) |
| `header` | `string` | Tiêu đề cột |
| `sortable` | `boolean` | Cho phép sort |
| `filterable` | `boolean` | Hiện filter input |
| `filterType` | `FilterType` | Loại filter input |
| `filterOptions` | `{label,value}[]` | Dùng cho `select` / `multi-select` |
| `filterPlaceholder` | `string` | Placeholder của filter input |
| `filterOperators` | `FilterOperator[]` | Operators cho filter `number`/`text` |
| `hideable` | `boolean` | default `true`, `false` = luôn hiện |
| `defaultHidden` | `boolean` | Ẩn mặc định khi lần đầu load |
| `sticky` | `'left' \| 'right'` | Pin cột |
| `width` | `string` | CSS width (vd: `'120px'`) |
| `minWidth` | `string` | CSS min-width |
| `render` | `(value, row, index) => ReactNode` | Custom cell render |
| `className` | `string` | Class cho `<td>` |
| `headerClassName` | `string` | Class cho `<th>` |

---

## DataTableConfig — tất cả options

```ts
const config: DataTableConfig<MyRow> = {
  // Toolbar
  tableId: 'my-table',          // cần cho persist + URL sync
  showSearch: true,
  searchPlaceholder: 'Tìm...',
  searchKeys: ['email', 'name'], // chỉ dùng ở client-side mode
  showFilters: true,             // auto: true khi có filterable column
  showColumnVisibility: true,
  showDensityToggle: true,
  showRefreshButton: true,

  // Custom toolbar slots
  toolbarLeft: <MyCustomButton />,
  toolbarRight: <ExtraActions />,

  // Filter presets (quick chip filters)
  filterPresets: [
    {
      label: 'Active only',
      filters: { isActive: { type: 'boolean', value: 'true', operator: 'eq' } },
    },
  ],

  // Pagination
  showPagination: true,          // default true
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],

  // Row selection + bulk actions
  selectable: true,
  bulkActions: [
    {
      key: 'delete',
      label: 'Xoá',
      variant: 'destructive',
      icon: <Trash className="h-3.5 w-3.5" />,
      onClick: (rows) => handleBulkDelete(rows),
    },
  ],

  // Row expansion
  expandable: (row) => <RowDetailPanel row={row} />,

  // Export CSV
  exportable: true,
  exportFilename: 'my-export',
  onExport: (data, format) => customExport(data, format), // optional override

  // Persistence (yêu cầu tableId)
  persistColumnVisibility: true,
  persistPageSize: true,
  persistFilters: true,
  persistSort: true,
  persistDensity: true,

  // URL sync (yêu cầu tableId + React Router context)
  syncToUrl: true,
}
```

---

## `useDataTable` — dùng trực tiếp

Trả về `UseDataTableReturn<T>`. Hữu ích khi cần access state ngoài component (ví dụ: đọc `selectedRows`).

```ts
const table = useDataTable<MyRow>(config)

// Pagination
table.page           // number
table.pageSize       // number
table.setPage(2)
table.setPageSize(50)

// Sort
table.sort           // SortState | null — { key: string, direction: 'asc'|'desc' }
table.handleSortToggle('email')  // toggle asc → desc → null

// Filters
table.filters        // FilterState
table.setFilter('isActive', { type: 'boolean', value: 'true', operator: 'eq' })
table.clearFilter('isActive')
table.clearAllFilters()
table.isFiltered     // boolean
table.activeFilterCount  // number

// Search
table.search
table.setSearch('keyword')

// Column visibility
table.columnVisibility
table.toggleColumn('email')
table.showAllColumns()
table.isColumnVisible('email')

// Row selection
table.selectedRows   // Set<string | number>
table.toggleRow('id-123')
table.toggleAll(allIds)
table.clearSelection()
table.isSelected('id-123')

// Density: 'compact' | 'default' | 'comfortable'
table.density
table.setDensity('compact')

// Row expansion
table.toggleExpanded('id-123')
table.isExpanded('id-123')

// nestjs-paginate params (server-side)
table.buildQueryParams(['email', 'name'])  // → NestjsPaginateParams

// Reset all state
table.resetAll()
```

---

## NestjsPaginateParams → API

`buildQueryParams()` tự build params cho nestjs-paginate:

```
page=1 & limit=20 & sortBy=email:ASC
& search=john & searchBy[]=email&searchBy[]=name
& filter.isActive=$eq:true
& filter.role=$ilike:%admin%
& filter.amount=$btw:100,500
```

Filter operators mapping:
| FilterOperator | nestjs-paginate |
|---|---|
| `eq` | `$eq` |
| `neq` | `$ne` |
| `contains` (text, default) | `$ilike` (wrapped `%value%`) |
| `starts_with` | `$sw` |
| `between` / range types | `$btw:min,max` |
| `gt/gte/lt/lte` | `$gt/$gte/$lt/$lte` |
| multi-select | `$in:v1,v2` |

---

## Cấu trúc files

```
data-table/
├── data-table.tsx          # Main component
├── types.ts                # Tất cả types (ColumnDef, DataTableConfig, FilterValue...)
├── utils.ts                # getNestedValue, matchesFilter, buildNestjsPaginateParams, exportToCsv
├── index.ts                # Public API — chỉ import qua đây
│
├── hooks/
│   ├── use-data-table.ts   # Core hook — state + handlers
│   ├── use-table-storage.ts # localStorage persistence
│   └── use-table-url-sync.ts # URL ↔ state sync (React Router)
│
├── filter-inputs/          # Một component cho mỗi FilterType
│   ├── text-filter.tsx
│   ├── select-filter.tsx
│   ├── boolean-filter.tsx
│   ├── number-filter.tsx
│   ├── number-range-filter.tsx
│   ├── multi-select-filter.tsx
│   ├── date-filter.tsx
│   ├── date-range-filter.tsx
│   ├── datetime-filter.tsx
│   └── index.ts
│
├── data-table-filter-row.tsx    # <tr> chứa filter inputs (trong <thead>)
├── data-table-toolbar.tsx       # Search / filter toggle / column visibility / density
├── data-table-pagination.tsx    # Pagination + page size selector
├── data-table-bulk-actions.tsx  # Toolbar khi có row được chọn
├── column-visibility-toggle.tsx # Popover toggle ẩn/hiện cột
├── density-toggle.tsx           # Compact / Default / Comfortable
├── filter-presets.tsx           # Quick filter chips
└── export-button.tsx            # Export CSV
```
