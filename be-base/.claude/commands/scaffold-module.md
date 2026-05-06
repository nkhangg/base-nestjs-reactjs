Scaffold a new NestJS domain module following the Clean Architecture pattern of this project.

## Arguments

`$ARGUMENTS` — format: `<module-name> [--entities e1,e2] [--admin] [--public] [--events] [--queue]`

Parse the arguments:
- First token = module name in **kebab-case** (e.g. `product`, `order-item`)
- `--entities e1,e2` — comma-separated entity names; if omitted, default to a single entity matching the module name
- `--admin` — generate admin controller + AdminFeature (default: true unless --no-admin)
- `--public` — generate public read-only controller
- `--events` — emit domain events on create/update/delete
- `--queue` — add BullMQ queue processor stub

Derive naming conventions from the module name:
- **kebab**: `product-variant` (used in file names, routes)
- **Pascal**: `ProductVariant` (used in class names)
- **UPPER_SNAKE**: `PRODUCT_VARIANT` (used in symbols, constants)
- **camelCase**: `productVariant` (used in variable names)
- **Module class**: `ProductVariantModule`

---

## Steps to execute

### STEP 1 — Read reference implementations

Before generating any file, read these files to internalize exact patterns:

1. `src/modules/user/domain/entities/user.entity.ts`
2. `src/modules/user/domain/repositories/user.repository.ts`
3. `src/modules/user/domain/value-objects/user-id.vo.ts`
4. `src/modules/user/application/use-cases/create-user.use-case.ts`
5. `src/modules/user/application/use-cases/list-users.use-case.ts`
6. `src/modules/user/application/use-cases/get-user.use-case.ts`
7. `src/modules/user/infrastructure/repositories/prisma-user.repository.ts`
8. `src/modules/user/infrastructure/repositories/in-memory-user.repository.ts`
9. `src/modules/user/infrastructure/mappers/user.mapper.ts`
10. `src/modules/user/presentation/user/user-management.controller.ts`
11. `src/modules/user/presentation/user/user-management.feature.ts`
12. `src/modules/user/user.module.ts`
13. `src/shared/domain/base-entity.ts`
14. `src/shared/domain/value-object.ts`

---

### STEP 2 — Generate domain layer

**File: `src/modules/<kebab>/domain/value-objects/<kebab>-id.vo.ts`**
- Copy pattern from `user-id.vo.ts` exactly
- Class name: `<Pascal>Id extends ValueObject<{ value: string }>`
- Import from `../../../../shared/domain/value-object`

**File: `src/modules/<kebab>/domain/entities/<kebab>.entity.ts`** (one per entity)
- `interface <Pascal>Props` with fields: always include `isActive: boolean`, `createdAt: Date`, and any domain-specific fields the user might want (name, description, etc.)
- `class <Pascal> extends BaseEntity<<Pascal>Id>` — private constructor pattern
- Static `create(params)` — generates new ID via `<Pascal>Id.create()`
- Static `reconstitute(id, props)` — for loading from DB via `<Pascal>Id.from(id)`
- Domain methods: `deactivate()`, `activate()`, `update<Field>(...)` as appropriate
- Getters for all props
- Import BaseEntity from `../../../../shared/domain/base-entity`

**File: `src/modules/<kebab>/domain/repositories/<kebab>.repository.ts`** (one per entity)
- `interface FindAll<Pascal>Options` with: `search?`, `isActive?`, `sortBy?`, `sortDir?`, `page?`, `pageSize?`
- `interface FindAll<Pascal>Result` with: `data: <Pascal>[]`, `total: number`
- `interface I<Pascal>Repository` with: `findById`, `findAll`, `save` (no delete — use deactivate pattern)
- `export const <UPPER_SNAKE>_REPOSITORY = Symbol('<UPPER_SNAKE>_REPOSITORY')`

**File: `src/modules/<kebab>/domain/events/<kebab>-created.event.ts`** (only if --events)
- Extend `DomainEvent` from `../../../../shared/domain/domain-event`
- `readonly eventName = '<kebab>.created'`
- Constructor with entity id + key fields as public readonly

---

### STEP 3 — Generate application layer

**File: `src/modules/<kebab>/application/use-cases/create-<kebab>.use-case.ts`**
- `interface Create<Pascal>Input` — fields needed for creation
- `type Create<Pascal>Result = Result<{ id: string }, string>`
- Class `Create<Pascal>UseCase` with `@Injectable()`
- Inject `@Inject(<UPPER_SNAKE>_REPOSITORY) private readonly repo: I<Pascal>Repository`
- Logic: check for duplicates if applicable → create entity → save → publish event (if --events) → return ok result

**File: `src/modules/<kebab>/application/use-cases/get-<kebab>.use-case.ts`**
- `type Get<Pascal>Result = Result<<Pascal>, string>`
- Inject repo → `findById` → return `{ ok: false, error: '<UPPER_SNAKE>_NOT_FOUND' }` if null

**File: `src/modules/<kebab>/application/use-cases/list-<kebab>s.use-case.ts`**
- Input type = `FindAll<Pascal>Options`
- Output type = `{ data: <Pascal>[]; total: number }`
- Delegate directly to `repo.findAll(input)` — no Result wrapper (can't fail)

**File: `src/modules/<kebab>/application/use-cases/update-<kebab>.use-case.ts`**
- `interface Update<Pascal>Input` — id + updatable fields
- `type Update<Pascal>Result = Result<void, string>`
- findById → if not found return error → call entity method → save

**File: `src/modules/<kebab>/application/use-cases/delete-<kebab>.use-case.ts`**
- `interface Delete<Pascal>Input { id: string }`
- `type Delete<Pascal>Result = Result<void, string>`
- findById → if not found return error → `entity.deactivate()` → save (soft delete pattern)

---

### STEP 4 — Generate infrastructure layer

**File: `src/modules/<kebab>/infrastructure/mappers/<kebab>.mapper.ts`**
- `interface <Pascal>Record` — flat DB record with all Prisma fields
- `export class <Pascal>Mapper`
- Static `toDomain(r: <Pascal>Record): <Pascal>` — calls `<Pascal>.reconstitute(r.id, { ... })`

**File: `src/modules/<kebab>/infrastructure/repositories/prisma-<kebab>.repository.ts`**
- `@Injectable()` class `Prisma<Pascal>Repository implements I<Pascal>Repository`
- Inject `PrismaService` from `../../../../shared/infrastructure/prisma/prisma.service`
- `findById`: `prisma.<camelCase>.findUnique({ where: { id } })` → map or null
- `findAll`: build where object from options → `Promise.all([findMany, count])` → map
- `save`: `prisma.<camelCase>.upsert({ where: { id }, create: { id, ...data }, update: data })`

**File: `src/modules/<kebab>/infrastructure/repositories/in-memory-<kebab>.repository.ts`**
- `@Injectable()` class `InMemory<Pascal>Repository implements I<Pascal>Repository`
- `private readonly store = new Map<string, <Pascal>>()`
- `findById`: `store.get(id) ?? null`
- `findAll`: filter in memory with search/isActive/sortBy/page/pageSize
- `save`: `store.set(entity.id.value, entity)`

---

### STEP 5 — Generate presentation layer

**File: `src/modules/<kebab>/presentation/admin/<kebab>-admin.controller.ts`** (if --admin)

Follow the exact pattern from `user-management.controller.ts`:
- DTOs inline in same file (class `Create<Pascal>Dto`, `Update<Pascal>Dto`)
- Use `class-validator` decorators (`@IsString()`, `@IsOptional()`, etc.)
- Use `@ApiProperty()` / `@ApiPropertyOptional()` on all DTO fields
- `<UPPER_SNAKE>_PAGINATE_CONFIG` constant with `sortableColumns`, `searchableColumns`, `filterableColumns`, `defaultLimit: 20`, `maxLimit: 100`
- Controller:
  - `@ApiTags('<Pascal> Management')`
  - `@ApiCookieAuth('access_token')`
  - `@Controller('admin/<kebab>s')`
  - `@UseGuards(AdminAuthGuard)`
- Routes (static before param — required by NestJS):
  - `GET /admin/<kebab>s` — `@RequirePermission('<kebab>-management', 'read')` + paginate
  - `POST /admin/<kebab>s` — `@RequirePermission('<kebab>-management', 'create')`
  - `GET /admin/<kebab>s/:id` — `@RequirePermission('<kebab>-management', 'read')`
  - `PATCH /admin/<kebab>s/:id` — `@RequirePermission('<kebab>-management', 'update')`
  - `DELETE /admin/<kebab>s/:id` — `@HttpCode(200)` + `@RequirePermission('<kebab>-management', 'delete')` → calls deactivate use-case

**File: `src/modules/<kebab>/presentation/admin/<kebab>-admin.feature.ts`** (if --admin)
```ts
import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { <Pascal>AdminController } from './<kebab>-admin.controller';

export const <Pascal>AdminFeature: AdminFeature = {
  resource: '<kebab>-management',
  controller: <Pascal>AdminController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: {
    label: '<Pascal> Management',
    icon: '<kebab>',
    order: 10,
  },
};
```

**File: `src/modules/<kebab>/presentation/public/<kebab>-public.controller.ts`** (only if --public)
- `@Controller('<kebab>s')`
- `@Public()` decorator (no auth guard)
- `GET /<kebab>s` — paginated list of active records
- `GET /<kebab>s/:id` — get one by id

---

### STEP 6 — Generate module file

**File: `src/modules/<kebab>/<kebab>.module.ts`**

Follow the exact pattern from `user.module.ts`:

```ts
import { Module, OnModuleInit } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
// ... all imports

const <UPPER_SNAKE>_ROLES: SeedRoleDefinition[] = [
  // one admin viewer role with 'read' permission on '<kebab>-management'
  // one admin editor role with full CRUD permissions on '<kebab>-management'
];

@Module({
  controllers: [/* admin + public controllers */],
  providers: [
    { provide: <UPPER_SNAKE>_REPOSITORY, useClass: Prisma<Pascal>Repository } as ClassProvider,
    { provide: ADMIN_FEATURE, useValue: <Pascal>AdminFeature, multi: true } as ValueProvider,
    // all use-case classes
  ],
  exports: [<UPPER_SNAKE>_REPOSITORY],
})
export class <Pascal>Module implements OnModuleInit {
  constructor(
    @Inject(<UPPER_SNAKE>_REPOSITORY) private readonly repo: I<Pascal>Repository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.authorizationService.seedRoles(<UPPER_SNAKE>_ROLES);
  }
}
```

---

### STEP 7 — Patch app.module.ts

Read `src/app.module.ts`, then edit it to add:
1. Import statement: `import { <Pascal>Module } from './modules/<kebab>/<kebab>.module';`
2. Add `<Pascal>Module` to the `imports` array (after existing domain modules, before `IntegrationModule`)

---

### STEP 8 — Create module documentation

**File: `.claude/modules/<kebab>.md`**

Write a documentation file following the exact format of `.claude/modules/user.md`:

```markdown
# Module: modules/<kebab>

## Mục đích
<one sentence describing what this module manages>

## Cấu trúc
\`\`\`
modules/<kebab>/
├── domain/
│   ├── entities/<kebab>.entity.ts
│   ├── repositories/<kebab>.repository.ts   # <UPPER_SNAKE>_REPOSITORY symbol
│   └── value-objects/<kebab>-id.vo.ts
├── application/use-cases/
│   ├── create-<kebab>.use-case.ts
│   ├── get-<kebab>.use-case.ts
│   ├── list-<kebab>s.use-case.ts
│   ├── update-<kebab>.use-case.ts
│   └── delete-<kebab>.use-case.ts
├── infrastructure/
│   ├── mappers/<kebab>.mapper.ts
│   └── repositories/
│       ├── in-memory-<kebab>.repository.ts
│       └── prisma-<kebab>.repository.ts
├── presentation/
│   ├── admin/
│   │   ├── <kebab>-admin.controller.ts
│   │   └── <kebab>-admin.feature.ts
│   └── public/                              # only if --public
│       └── <kebab>-public.controller.ts
└── <kebab>.module.ts
\`\`\`

## API Routes

### Admin (`/admin/<kebab>s`)
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/<kebab>s` | read |
| POST | `/admin/<kebab>s` | create |
| GET | `/admin/<kebab>s/:id` | read |
| PATCH | `/admin/<kebab>s/:id` | update |
| DELETE | `/admin/<kebab>s/:id` | delete |

## Seeded Roles
| Role | SubjectType | Permissions |
|---|---|---|
| <kebab>-editor | admin | <kebab>-management → read, create, update, delete |
| <kebab>-viewer | admin | <kebab>-management → read |

## Domain Events Published
<list if --events, otherwise "None">

## Dependencies
<list any special module dependencies>
```

---

### STEP 9 — Print Prisma schema snippet

After all files are generated, print to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PRISMA SCHEMA — thêm vào prisma/schema.prisma
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

model <Pascal> {
  id        String   @id @default(uuid())
  // TODO: add your domain fields here
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("<camelCase>s")
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SAU KHI THÊM SCHEMA, chạy:
   npx prisma migrate dev --name add-<kebab>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Quality checklist (verify before finishing)

- [ ] All imports use relative paths (not aliases)
- [ ] `<UPPER_SNAKE>_REPOSITORY` Symbol is exported from the repository file
- [ ] No circular imports — domain has zero NestJS/Prisma deps
- [ ] `app.module.ts` has the new import and module in imports array
- [ ] Static routes declared before param routes in controllers
- [ ] All DTO fields have `@ApiProperty` decorators
- [ ] `onModuleInit` seeds roles via `authorizationService.seedRoles()`
- [ ] `.claude/modules/<kebab>.md` created
