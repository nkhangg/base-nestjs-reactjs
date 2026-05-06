Load context for a specific domain module before doing any work on it.

## Arguments

`$ARGUMENTS` — format: `<module-name>`

The module name should match a file in `.claude/modules/`. Examples: `user`, `blog`, `merchant`, `notification`, `audit`, `media`, `config`, `admin`.

---

## Steps to execute

### STEP 1 — Read module documentation

Read the primary module doc:
- `.claude/modules/<module-name>.md`

If the file does not exist, stop and tell the user: "No module doc found for '<module-name>'. Available modules: $(list files in .claude/modules/ without extension)."

---

### STEP 2 — Detect and read core dependencies

Based on what you find in the module doc (imports, dependencies, events, queue references), read the relevant core docs from `.claude/modules/`:

| If module doc mentions | Read this core doc |
|---|---|
| `AuthModule`, `JWT`, `login`, `session`, `ICredentialValidator` | `core-auth.md` |
| `@RequirePermission`, `AdminAuthGuard`, `RBAC`, `roles`, `permissions` | `core-authorization.md` |
| `AdminFeature`, `ADMIN_FEATURE`, `AdminModule` | `core-admin-shell.md` |
| `DomainEvent`, `EventPublisher`, `eventName` | `core-events.md` |
| `BullMQ`, `Queue`, `Processor`, `Job` | `core-queue.md` |
| `NotificationModule`, `WebSocket`, `Socket.IO` | `notification.md` |
| `IntegrationModule`, event → queue → notification | `core-integration.md` |

Only read the docs that are actually relevant — do not read all of them.

---

### STEP 3 — Report loaded context

Print a summary to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MODULE CONTEXT LOADED: <module-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Module doc:   .claude/modules/<module-name>.md
Core docs:    <list of core docs read, or "none">

Mục đích:     <one line from the module doc>
Key patterns: <2–3 bullet points — most important conventions to follow>

Ready. Mày muốn làm gì với module này?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

After printing this summary, wait for the user's next instruction. Do NOT start implementing anything.
