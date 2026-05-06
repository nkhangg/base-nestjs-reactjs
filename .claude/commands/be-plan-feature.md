Plan a new feature for an existing BE domain module (be-base). Produces a detailed implementation plan without writing any code.

## Arguments

`$ARGUMENTS` — format: `<module-name> <feature description>`

Examples:
- `blog add slug field to BlogPost entity and expose in API`
- `user export user list as CSV`
- `notification mark all notifications as read endpoint`
- `merchant add webhook support for payment events`

Parse:
- First token = **module name** (must match an existing module in `be-base/src/modules/`)
- Rest = **feature description** in plain language

---

## Steps to execute

### STEP 1 — Load module context

Read this file before planning:

1. `be-base/.claude/modules/<module-name>.md` — understand structure, patterns, existing routes, domain model

If the module doc does not exist, tell the user and stop.

---

### STEP 2 — Detect core dependencies

Based on the feature description and module doc, determine which core docs are relevant (all in `be-base/.claude/modules/`):

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

Read the minimal set of source files needed to plan accurately (all under `be-base/`):

- If touching **entity**: read `src/modules/<module>/domain/entities/<module>.entity.ts`
- If touching **repository interface**: read `src/modules/<module>/domain/repositories/<module>.repository.ts`
- If touching **use-case**: read the most similar existing use-case
- If touching **controller**: read the existing controller
- If touching **Prisma repo**: read `src/modules/<module>/infrastructure/repositories/prisma-<module>.repository.ts`
- If touching **mapper**: read `src/modules/<module>/infrastructure/mappers/<module>.mapper.ts`

Do NOT read the entire module — only files directly relevant to the feature.

---

### STEP 4 — Produce implementation plan

Print the full plan in this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 [BE] FEATURE PLAN
 Module  : <module-name>
 Feature : <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Tóm tắt
<2–3 câu mô tả feature làm gì, tại sao cần thêm, impact với hệ thống>

---

## Layer breakdown

### Domain
<Describe changes needed — new entity methods, new repo interface methods, new events>
Files:
  - CREATE  be-base/src/modules/<module>/domain/...   — <what>
  - MODIFY  be-base/src/modules/<module>/domain/...   — <what>
  (or "No changes needed")

### Application
<Describe new or modified use-cases>
Files:
  - CREATE  be-base/src/modules/<module>/application/use-cases/...   — <what>
  - MODIFY  be-base/src/modules/<module>/application/use-cases/...   — <what>
  (or "No changes needed")

### Infrastructure
<Describe Prisma repo changes, mapper changes, in-memory repo changes>
Files:
  - MODIFY  be-base/src/modules/<module>/infrastructure/...   — <what>
  (or "No changes needed")

### Presentation
<Describe new routes, DTO changes, controller changes>
Files:
  - MODIFY  be-base/src/modules/<module>/presentation/...   — <what>
  New route: METHOD /path — permission required
  (or "No changes needed")

---

## Prisma schema
<If schema changes needed, show the exact snippet to add/modify.>
<If not needed, write: "No schema changes needed.">

Migration name: `<descriptive-migration-name>`

---

## Edge cases & risks
- <edge case or risk 1>
- <edge case or risk 2>
- <add more as relevant — at minimum 2, only include real risks not obvious non-issues>

---

## Effort estimate
| Layer | Effort |
|---|---|
| Domain | Low / Medium / High |
| Application | Low / Medium / High |
| Infrastructure | Low / Medium / High |
| Presentation | Low / Medium / High |
| **Total** | **Low / Medium / High** |

---

## Checklist khi implement
- [ ] <specific thing to verify for this feature>
- [ ] All new imports use relative paths
- [ ] No domain layer files import from NestJS or Prisma
- [ ] New DTO fields have `@ApiProperty` decorators
- [ ] `InMemory` repository updated to match any new interface methods
- [ ] New admin routes have `@RequirePermission` decorator
- [ ] Static routes declared before param routes
- [ ] `be-base/.claude/modules/<module-name>.md` updated after implementation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Để implement theo plan này, chạy:
  /be-add-feature <module-name> <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do NOT implement anything. Stop after printing the plan.
