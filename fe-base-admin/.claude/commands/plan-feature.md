Plan a new feature for an existing frontend module. Produces a detailed implementation plan without writing any code.

## Arguments

`$ARGUMENTS` — format: `<module-name> <feature description>`

Examples:
- `blog add category filter to BlogPage`
- `user add bulk deactivate action to DataTable`
- `media add drag-and-drop upload support`
- `notification mark all as read button`

Parse:
- First token = **module name** (must match an existing module in `src/modules/`)
- Rest = **feature description** in plain language

---

## Steps to execute

### STEP 1 — Load module context

Read this file before planning:

1. `.claude/modules/<module-name>.md` — understand structure, routes, existing components, hooks, API endpoints

If the module doc does not exist, tell the user and stop.

---

### STEP 2 — Detect shared dependencies

Based on the feature description and module doc, determine which shared docs are relevant:

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

Read the minimal set of source files needed to plan accurately:

- If touching **types**: read `types/index.ts`
- If touching **service**: read `services/<module>.service.ts`
- If touching **hooks**: read the most relevant existing hook
- If touching **component**: read the most similar existing component
- If touching **router**: read `app/router.tsx` and `shared/constants/` for ROUTES

Do NOT read the entire module — only files directly relevant to the feature.

---

### STEP 4 — Produce implementation plan

Print the full plan in this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FEATURE PLAN
 Module  : <module-name>
 Feature : <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tóm tắt
<2–3 câu mô tả feature làm gì, UX flow, impact với module>

---

## Layer breakdown

### Types
<Describe new types, DTOs, or interface changes needed>
Files:
  - MODIFY  src/modules/<module>/types/index.ts   — <what>
  (or "No changes needed")

### Service
<Describe new API call functions>
Files:
  - MODIFY  src/modules/<module>/services/<module>.service.ts   — <what>
  (or "No changes needed")

### Hooks
<Describe new useQuery / useMutation hooks, cache invalidation strategy>
Files:
  - MODIFY  src/modules/<module>/hooks/...   — <what>
  - CREATE  src/modules/<module>/hooks/use<Feature>.ts   — <what>
  (or "No changes needed")

### Components
<Describe new or modified React components, forms, dialogs>
Files:
  - CREATE  src/modules/<module>/components/...   — <what>
  - MODIFY  src/modules/<module>/components/...   — <what>
  (or "No changes needed")

### Router & Navigation
<Describe new routes, ROUTES constant, sidebar entry>
Files:
  - MODIFY  src/app/router.tsx   — <what>
  - MODIFY  src/shared/constants/   — <what>
  (or "No changes needed")

### i18n
<List new translation keys needed>
  vi.json: <key: "value in Vietnamese">
  en.json: <key: "value in English">
  (or "No changes needed")

---

## UX notes
- <Loading state handling>
- <Error state handling>
- <Empty state handling if applicable>
- <Confirmation dialog needed? Yes/No — reason>

---

## Edge cases & risks
- <edge case or risk 1>
- <edge case or risk 2>
- <add more as relevant — at minimum 2, only include real risks not obvious non-issues>

---

## Effort estimate
| Layer | Effort |
|---|---|
| Types | Low / Medium / High |
| Service | Low / Medium / High |
| Hooks | Low / Medium / High |
| Components | Low / Medium / High |
| Router | Low / Medium / High |
| **Total** | **Low / Medium / High** |

---

## Checklist khi implement
- [ ] <specific thing to verify for this feature>
- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each new API call
- [ ] `useQuery` hooks have correct `queryKey` from `QUERY_KEYS`
- [ ] `useMutation` hooks invalidate relevant queries on success
- [ ] Toast notifications on success and error
- [ ] All user-facing strings use `useTranslation()` — keys added to vi.json + en.json
- [ ] Forms use React Hook Form + Zod validation
- [ ] Destructive actions have confirmation dialog
- [ ] New routes use lazy loading and added to `router.tsx`
- [ ] `.claude/modules/<module-name>.md` updated after implementation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Để implement theo plan này, chạy:
  /add-feature <module-name> <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do NOT implement anything. Stop after printing the plan.
