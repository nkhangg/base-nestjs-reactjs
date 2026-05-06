Scaffold a new feature module for the fe-base-admin React admin portal, following the exact conventions and patterns of this project.

## Arguments

`$ARGUMENTS` — format: `<module-name> [--nav-group Overview|Management|System] [--nav-icon <LucideIconName>] [--resource <rbac-resource>]`

Parse the arguments:
- First token = module name in **kebab-case** (e.g. `product`, `order-item`)
- `--nav-group` — which sidebar group to add the nav item to (default: `Management`)
- `--nav-icon` — Lucide icon name (PascalCase, e.g. `Package`, `ShoppingCart`); default: `Package`
- `--resource` — RBAC resource name used in AdminGuard check (default: `<kebab>-management`)

Derive naming conventions from the module name:
- **kebab**: `product-variant` (file names, routes, query keys)
- **Pascal**: `ProductVariant` (component, type, service names)
- **camelCase**: `productVariant` (hook names prefix, service variable)
- **UPPER_SNAKE**: `PRODUCT_VARIANT` (constants)
- **Route path**: `/<kebab>s` (e.g. `/products`)
- **ROUTES key**: `<UPPER_SNAKE>S` (e.g. `PRODUCTS`)
- **Query key root**: `['<kebab>s']`

---

## Steps to execute

### STEP 1 — Read reference implementations

Before generating any file, read these files to internalize the exact patterns:

1. `src/modules/user/types/index.ts`
2. `src/modules/user/services/user.service.ts`
3. `src/modules/user/hooks/useUsers.ts`
4. `src/modules/user/components/UserPage.tsx`
5. `src/modules/user/index.ts`
6. `src/config/routes.ts`
7. `src/shared/constants/index.ts`
8. `src/app/router.tsx`
9. `src/shared/layouts/MainLayout.tsx`

---

### STEP 2 — Generate types

**File: `src/modules/<kebab>/types/index.ts`**

```ts
export interface <Pascal> {
  id: string
  // TODO: add domain fields (name, description, etc.)
  isActive: boolean
  createdAt: string
}

export interface Create<Pascal>Dto {
  // TODO: fields required for creation
}

export interface Update<Pascal>Dto {
  // TODO: updatable fields (all optional)
}

export interface <Pascal>ListResponse {
  data: <Pascal>[]
  meta: {
    totalItems: number
    currentPage: number
    itemsPerPage: number
    totalPages: number
  }
}
```

---

### STEP 3 — Generate service

**File: `src/modules/<kebab>/services/<kebab>.service.ts`**

Follow exact pattern from `user.service.ts`:
- Import `apiClient` from `@lib/api-client`
- Import `NestjsPaginateParams` from `@shared/components/ui/data-table`
- Named export object `<camelCase>Service` with methods:
  - `list<Pascal>s(params?: NestjsPaginateParams): Promise<<Pascal>ListResponse>`
    - `GET /admin/<kebab>s`
  - `get<Pascal>(id: string): Promise<<Pascal>>`
    - `GET /admin/<kebab>s/:id`
  - `create<Pascal>(dto: Create<Pascal>Dto): Promise<{ success: boolean; id: string }>`
    - `POST /admin/<kebab>s`
  - `update<Pascal>(id: string, dto: Update<Pascal>Dto): Promise<void>`
    - `PATCH /admin/<kebab>s/:id`
  - `delete<Pascal>(id: string): Promise<void>`
    - `DELETE /admin/<kebab>s/:id` (soft delete → deactivate)
- All calls include `{ withCredentials: true }`

---

### STEP 4 — Generate hooks

**File: `src/modules/<kebab>/hooks/use<Pascal>s.ts`**

Follow exact pattern from `useUsers.ts`:

```ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NestjsPaginateParams } from '@shared/components/ui/data-table'
import { <camelCase>Service } from '../services/<kebab>.service'
import type { Create<Pascal>Dto, Update<Pascal>Dto } from '../types'

export const <UPPER_SNAKE>S_QUERY_KEY = ['<kebab>s']

export function use<Pascal>s(params: NestjsPaginateParams) {
  return useQuery({
    queryKey: [...<UPPER_SNAKE>S_QUERY_KEY, JSON.stringify(params)],
    queryFn: () => <camelCase>Service.list<Pascal>s(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreate<Pascal>() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: <camelCase>Service.create<Pascal>,
    onSuccess: () => qc.invalidateQueries({ queryKey: <UPPER_SNAKE>S_QUERY_KEY }),
  })
}

export function useUpdate<Pascal>() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Update<Pascal>Dto) =>
      <camelCase>Service.update<Pascal>(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: <UPPER_SNAKE>S_QUERY_KEY }),
  })
}

export function useDelete<Pascal>() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => <camelCase>Service.delete<Pascal>(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: <UPPER_SNAKE>S_QUERY_KEY }),
  })
}
```

---

### STEP 5 — Generate page component

**File: `src/modules/<kebab>/components/<Pascal>Page.tsx`**

Follow the full pattern from `UserPage.tsx`. Generate a complete, working page:

**Imports block:**
- React hooks: `useState`, `useEffect`
- `useForm`, `Controller` from `react-hook-form`
- `zodResolver` from `@hookform/resolvers/zod`
- `z` from `zod`
- Lucide icons: `Plus`, `MoreHorizontal`, `Pencil`, `AlertTriangle`, `ShieldOff`, `ShieldCheck`
- Shared UI: `Button`, `Input`, `Badge`, `DataTable`, `useDataTable`, `ColumnDef`, `Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger`, `StatCard`, `FieldLabel`, `FieldError`
- `cn` from `@shared/utils`
- Module hooks and types

**Structure (copy pattern exactly):**

1. `FormField` helper component — label + children + error message wrapper

2. `Create<Pascal>Modal` — Dialog with React Hook Form + Zod:
   - Schema: validate all Create fields
   - On success: `reset()` + `onClose()`
   - Show error alert if mutation fails

3. `Edit<Pascal>Modal` — Dialog with React Hook Form + Zod:
   - Props: `{ item: <Pascal> | null, open, onClose }`
   - `useEffect(() => { if (item) reset({ ... }) }, [item, reset])`
   - On success: `onClose()`

4. `ActionDropdown` component — DropdownMenu with Edit + Delete (inline confirm pattern):
   - Delete: show inline confirm (`confirmDelete` state) → call `useDelete<Pascal>()`
   - Props: `{ item: <Pascal>; onEdit: (item: <Pascal>) => void }`

5. `buildColumns(onEdit)` function → `ColumnDef<<Pascal>Row>[]`:
   - At minimum: main identifier column, `isActive` status column (Badge), `createdAt` column, actions column
   - `isActive` column: `filterable: true, filterType: 'select'` with Active/Inactive options
   - `createdAt` column: `sortable: true`, format with `toLocaleDateString('vi-VN')`
   - actions column: `width: '56px'`, render `<ActionDropdown />`

6. `export function <Pascal>Page()` — main page:
   ```tsx
   const table = useDataTable<<Pascal>Row>({
     tableId: '<kebab>-list',
     showSearch: true,
     searchPlaceholder: 'Tìm kiếm...',
     showFilters: true,
     showColumnVisibility: true,
     showRefreshButton: true,
     persistPageSize: true,
     persistFilters: true,
     persistSort: true,
     syncToUrl: true,
   })
   ```
   - Fetch data: `use<Pascal>s(table.buildQueryParams([/* searchable fields */]))`
   - State: `showCreate`, `editingItem`
   - Layout:
     - Header with title + "Tạo mới" button
     - StatCard grid (total count, active count, inactive count)
     - Error state (AlertTriangle)
     - `<DataTable>` with `total={meta?.totalItems}` for server-side mode
     - Create modal + Edit modal

---

### STEP 6 — Generate module index

**File: `src/modules/<kebab>/index.ts`**

```ts
export { <Pascal>Page } from './components/<Pascal>Page'
export {
  use<Pascal>s,
  useCreate<Pascal>,
  useUpdate<Pascal>,
  useDelete<Pascal>,
} from './hooks/use<Pascal>s'
export type { <Pascal>, Create<Pascal>Dto, Update<Pascal>Dto } from './types'
```

---

### STEP 7 — Patch 4 files

#### 7a. `src/config/routes.ts`
Add to the `ROUTES` object:
```ts
<UPPER_SNAKE>S: '/<kebab>s',
```

#### 7b. `src/shared/constants/index.ts`
Add to `QUERY_KEYS`:
```ts
<UPPER_SNAKE>S: ['<kebab>s'] as const,
```

#### 7c. `src/app/router.tsx`
Add lazy import (grouped with other module imports):
```ts
const <Pascal>Page = lazy(() =>
  import('@modules/<kebab>/index').then((m) => ({ default: m.<Pascal>Page }))
)
```
Add route inside the `AdminGuard` → `MainLayout` children:
```ts
{ path: ROUTES.<UPPER_SNAKE>S, element: withSuspense(<<Pascal>Page />) },
```

#### 7d. `src/shared/layouts/MainLayout.tsx`
Add import for the chosen Lucide icon (if not already imported).
Add nav item to the correct `navGroups` group (per `--nav-group` arg):
```ts
{
  to: ROUTES.<UPPER_SNAKE>S,
  label: '<Pascal> Management',
  icon: <NavIcon>,
  requireRole: true,
  resource: '<resource>',
}
```

---

### STEP 8 — Create module documentation

**File: `.claude/modules/<kebab>.md`**

Write documentation following the exact format of `.claude/modules/user.md`:

```markdown
# Module: modules/<kebab>

## Mục đích
<one sentence describing what this module manages>

## Cấu trúc
\`\`\`
modules/<kebab>/
├── components/
│   └── <Pascal>Page.tsx       # List + CRUD, dùng DataTable server-side
├── hooks/
│   └── use<Pascal>s.ts        # use<Pascal>s, useCreate<Pascal>, useUpdate<Pascal>, useDelete<Pascal>
├── services/
│   └── <kebab>.service.ts
├── types/
│   └── index.ts               # <Pascal>, Create<Pascal>Dto, Update<Pascal>Dto
└── index.ts
\`\`\`

## Routes
| Route | Component | Guard |
|---|---|---|
| `/<kebab>s` | `<Pascal>Page` | `AdminGuard` |

## API Endpoints
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/<kebab>s` | `use<Pascal>s` |
| POST | `/admin/<kebab>s` | `useCreate<Pascal>` |
| GET | `/admin/<kebab>s/:id` | — |
| PATCH | `/admin/<kebab>s/:id` | `useUpdate<Pascal>` |
| DELETE | `/admin/<kebab>s/:id` | `useDelete<Pascal>` |
```

---

## Quality checklist (verify before finishing)

- [ ] All imports use path aliases (`@modules/*`, `@shared/*`, `@lib/*`, `@config/*`) — no relative `../../`
- [ ] Module exports only through `index.ts` — no deep imports in patches
- [ ] `ROUTES.<UPPER_SNAKE>S` added to `src/config/routes.ts`
- [ ] Query key added to `QUERY_KEYS` in `src/shared/constants/index.ts`
- [ ] Lazy import + route added in `src/app/router.tsx` inside `AdminGuard → MainLayout`
- [ ] Nav item added to correct group in `src/shared/layouts/MainLayout.tsx`
- [ ] Lucide icon imported in `MainLayout.tsx` if not already present
- [ ] `<Pascal>Page` uses `useDataTable` with `syncToUrl: true`
- [ ] DataTable passes `total={meta?.totalItems}` for server-side pagination
- [ ] `buildQueryParams([...])` passes the correct searchable field names (matching BE `searchableColumns`)
- [ ] `.claude/modules/<kebab>.md` created
