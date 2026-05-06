Load context for a specific frontend module before doing any work on it.

## Arguments

`$ARGUMENTS` — format: `<module-name>`

The module name should match a file in `.claude/modules/`. Examples: `user`, `blog`, `auth`, `notification`, `audit`, `media`, `config`, `admin`, `dashboard`, `profile`.

---

## Steps to execute

### STEP 1 — Read module documentation

Read the primary module doc:
- `.claude/modules/<module-name>.md`

If the file does not exist, stop and tell the user: "No module doc found for '<module-name>'. Available modules: $(list files in .claude/modules/ without extension)."

---

### STEP 2 — Detect and read shared dependencies

Based on what you find in the module doc (routes, components, hooks, API endpoints), read relevant shared module docs:

| If module doc mentions | Read this doc |
|---|---|
| `AdminGuard`, `useAuth`, `AuthContext`, login, session | `auth.md` |
| `DataTable`, `MediaPicker`, `shadcn`, shared components | `shared-ui.md` |
| `useNotifications`, bell, WebSocket, Socket.IO | `notification.md` |
| File upload, `MediaPicker`, image picker | `media.md` |
| `usePermission`, RBAC, resource check | `auth.md` |

Only read docs that are actually relevant — do not read all of them.

---

### STEP 3 — Report loaded context

Print a summary to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MODULE CONTEXT LOADED: <module-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Module doc:   .claude/modules/<module-name>.md
Shared docs:  <list of shared docs read, or "none">

Mục đích:     <one line from the module doc>
Key patterns: <2–3 bullet points — most important conventions to follow>

Ready. Mày muốn làm gì với module này?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

After printing this summary, wait for the user's next instruction. Do NOT start implementing anything.
