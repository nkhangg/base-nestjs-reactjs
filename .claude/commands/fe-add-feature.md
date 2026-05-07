Add a new feature to an existing FE module (fe-base-admin), following the established patterns of this codebase.

## Arguments

`$ARGUMENTS` — format: `<module-name> <feature description>`

Examples:
- `blog add category filter to BlogPage`
- `user add bulk deactivate action to DataTable`
- `media add drag-and-drop upload support`
- `notification mark all as read button`

Parse:
- First token = **module name** (must match an existing module in `fe-base-admin/src/modules/`)
- Rest = **feature description** in plain language

---

## Steps to execute

### STEP 1 — Load module context

Read this file before writing any code:

1. `fe-base-admin/.claude/modules/<module-name>.md` — understand structure, routes, existing components, hooks, API endpoints

If the module doc does not exist, tell the user and stop.

---

### STEP 2 — Detect shared dependencies

Based on the feature description and module doc, determine which shared docs to load (all in `fe-base-admin/.claude/modules/`):

| Feature involves | Read this doc |
|---|---|
| Auth, guard, session, login, permission check | `auth.md` |
| Table, DataTable, columns, filters, pagination | `shared-ui.md` |
| MediaPicker, file upload, image picker | `media.md` |
| Notification, WebSocket, bell, real-time | `notification.md` |
| New route, navigation, sidebar link | `shared-ui.md` |
| i18n, translation keys | `shared-ui.md` |

Only read docs that are actually needed for this feature.

---

### STEP 3 — Read relevant source files

Read the **minimal set** of source files needed to understand the exact pattern (all under `fe-base-admin/`):

- If adding a new **component**: read the most similar existing component in this module
- If adding a new **hook**: read an existing hook in `hooks/` of this module
- If adding a new **service method**: read `src/modules/<module>/services/<module>.service.ts`
- If adding a new **type/DTO**: read `src/modules/<module>/types/index.ts`
- If adding to **DataTable**: read an existing DataTable usage in this module
- If adding a **form**: read an existing form in this module (React Hook Form + Zod pattern)
- If adding a **route**: read `src/app/router.tsx`

Do NOT read the entire module — only files directly relevant to the feature type.

---

### STEP 4 — Plan before implementing

Before writing any code, print a concise implementation plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [FE] IMPLEMENTATION PLAN
 Module: <module-name>
 Feature: <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files to CREATE:
  - <file path> — <what it contains>

Files to MODIFY:
  - <file path> — <what changes>

Layer changes:
  Types:      <new/modified types or "none">
  Service:    <new API calls or "none">
  Hooks:      <new/modified TanStack Query hooks or "none">
  Components: <new/modified components or "none">
  Router:     <new route or "none">
  i18n:       <new translation keys or "none">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then ask: "Proceed with implementation?" — wait for user confirmation before writing any files.

---

### STEP 5 — Implement

After confirmation, implement all planned changes. Follow these rules strictly:

**Types rules:**
- All API response shapes defined in `types/index.ts` of the module
- Use `ApiResponse<T>` and `PaginatedResult<T>` from `shared/types`
- DTOs match BE field names exactly

**Service rules:**
- Service functions call `apiClient` from `lib/api-client/`
- One function per API endpoint, named clearly: `getUserById`, `createUser`
- No business logic in service — only HTTP calls

**Hook rules:**
- `useQuery` for GET operations — always include a `queryKey` from `QUERY_KEYS`
- `useMutation` for POST/PATCH/DELETE — always call `queryClient.invalidateQueries` on success
- Error handling: `onError` → `toast.error()` (Sonner)
- Success feedback: `onSuccess` → `toast.success()`

**Component rules:**
- Use shadcn/ui components — do not build from scratch
- Forms: React Hook Form + Zod schema validation
- Loading states: use `isLoading` / `isPending` from TanStack Query
- Confirmation dialogs for destructive actions
- Use `useTranslation()` for all user-facing strings — add keys to `shared/i18n/locales/vi.json` and `en.json`

**Router rules:**
- New routes use lazy loading: `lazy(() => import('./modules/...'))`
- Add to the correct route group in `src/app/router.tsx`
- Add `ROUTES.<KEY>` constant to `src/shared/constants/`

**accessibleResources rule (nav item với `resource` mới):**
- Nếu feature thêm một nav item vào `fe-base-admin/src/shared/layouts/MainLayout.tsx` với field `resource: '<key>'` chưa tồn tại trong danh sách, **bắt buộc** thêm `'<key>'` vào mảng `ADMIN_NAV_RESOURCES` trong `be-base/src/core/auth/presentation/http/auth.controller.ts`
- File BE: `ADMIN_NAV_RESOURCES = [ ..., '<new-resource-key>' ] as const`
- Nếu không cập nhật thì user sẽ không thấy nav item vì `accessibleResources` trả về từ `/auth/me` sẽ thiếu key mới

---

### STEP 6 — Update module doc

After implementing, update `fe-base-admin/.claude/modules/<module-name>.md` to reflect the new feature:
- Add new routes to the Routes table if applicable
- Add new API endpoints to the API Endpoints table if applicable
- Update the Cấu trúc section if new files were added

---

## Quality checklist (verify before finishing)

- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each new API call
- [ ] `useQuery` hooks have correct `queryKey` from `QUERY_KEYS`
- [ ] `useMutation` hooks invalidate relevant queries on success
- [ ] Toast notifications on success and error
- [ ] All user-facing strings use `useTranslation()` — keys added to vi.json + en.json
- [ ] Forms use React Hook Form + Zod validation
- [ ] Destructive actions have confirmation dialog
- [ ] New routes use lazy loading and are added to `router.tsx`
- [ ] If new nav item with `resource` key: `ADMIN_NAV_RESOURCES` in `be-base/src/core/auth/presentation/http/auth.controller.ts` updated
- [ ] `fe-base-admin/.claude/modules/<module-name>.md` updated
