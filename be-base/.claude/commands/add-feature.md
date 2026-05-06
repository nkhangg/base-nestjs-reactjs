Add a new feature to an existing domain module, following the established patterns of this codebase.

## Arguments

`$ARGUMENTS` — format: `<module-name> <feature description>`

Examples:
- `blog add slug field to BlogPost entity and expose in API`
- `user export user list as CSV`
- `notification mark all notifications as read endpoint`
- `merchant add webhook support for payment events`

Parse:
- First token = **module name** (must match an existing module in `src/modules/`)
- Rest = **feature description** in plain language

---

## Steps to execute

### STEP 1 — Load module context

Read these files before writing any code:

1. `.claude/modules/<module-name>.md` — understand structure, patterns, existing routes, domain model

If the module doc does not exist, tell the user and stop.

---

### STEP 2 — Detect core dependencies

Based on the **feature description** and what you read in the module doc, determine which core docs to load:

| Feature involves | Read this core doc |
|---|---|
| Auth, login, session, token, credential | `core-auth.md` |
| Permissions, roles, guards, `@RequirePermission` | `core-authorization.md` |
| Admin panel, AdminFeature, ADMIN_FEATURE | `core-admin-shell.md` |
| Domain events, publish/subscribe, `DomainEvent` | `core-events.md` |
| Background jobs, queue, BullMQ, async processing | `core-queue.md` |
| Push/in-app notifications, WebSocket | `notification.md` |
| Cross-module event → queue → notification flow | `core-integration.md` |

Only read docs that are actually needed for this feature.

---

### STEP 3 — Read relevant source files

Read the **minimal set** of source files needed to understand the exact implementation pattern:

- If adding a new **use-case**: read one existing use-case from this module (e.g. `create-*.use-case.ts`)
- If adding a new **route/endpoint**: read the existing controller for this module
- If adding a new **domain method**: read the entity file
- If adding a new **repository method**: read both the interface and the Prisma repository
- If adding a **queue job**: read an existing processor if one exists, otherwise read `core-queue.md`
- If adding a **domain event**: read an existing event file if one exists

Do NOT read the entire module — only the files directly relevant to the feature type.

---

### STEP 4 — Plan before implementing

Before writing any code, print a concise implementation plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 IMPLEMENTATION PLAN
 Module: <module-name>
 Feature: <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files to CREATE:
  - <file path> — <what it contains>

Files to MODIFY:
  - <file path> — <what changes>

Layer changes:
  Domain:        <entity/repo/event changes, or "none">
  Application:   <use-case changes, or "none">
  Infrastructure: <mapper/prisma repo changes, or "none">
  Presentation:  <controller/route changes, or "none">

Prisma schema:  <"changes needed" or "no change">
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then ask: "Proceed with implementation?" — wait for user confirmation before writing any files.

---

### STEP 5 — Implement

After confirmation, implement all planned changes. Follow these rules strictly:

**Domain layer rules:**
- Domain classes have zero NestJS/Prisma imports
- All imports use relative paths
- New entity methods are named semantically (`markAsRead()`, not `setIsRead(true)`)
- ID value objects use the existing `<Module>Id` pattern

**Application layer rules:**
- Each use-case is a single `@Injectable()` class in its own file
- Use `Result<T, E>` for operations that can fail; plain return for operations that cannot
- Use-cases only depend on repository interfaces (never Prisma directly)

**Infrastructure layer rules:**
- Only `Prisma<Pascal>Repository` talks to the database
- Update `InMemory<Pascal>Repository` to match any new interface methods
- Update mapper if entity has new fields

**Presentation layer rules:**
- New DTO fields must have `@ApiProperty()` / `@ApiPropertyOptional()`
- New routes must have `@RequirePermission(...)` if behind `AdminAuthGuard`
- Static routes before param routes (NestJS ordering requirement)
- `@HttpCode(200)` on DELETE routes

---

### STEP 6 — Update module doc

After implementing, update `.claude/modules/<module-name>.md` to reflect the new feature:
- Add new routes to the API Routes table if applicable
- Add new events to Domain Events Published if applicable
- Update the Cấu trúc section if new files were added

---

### STEP 7 — Print Prisma note (if schema changed)

If the feature requires Prisma schema changes, print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PRISMA — thêm/sửa vào prisma/schema.prisma
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<snippet of the schema change needed>

Sau khi sửa schema, chạy:
  npx prisma migrate dev --name <descriptive-migration-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Quality checklist (verify before finishing)

- [ ] All new imports use relative paths (not aliases)
- [ ] No domain layer files import from NestJS or Prisma
- [ ] New DTO fields have `@ApiProperty` decorators
- [ ] `InMemory` repository updated to match any new interface methods
- [ ] New admin routes have `@RequirePermission` decorator
- [ ] Static routes declared before param routes in controllers
- [ ] `.claude/modules/<module-name>.md` updated
