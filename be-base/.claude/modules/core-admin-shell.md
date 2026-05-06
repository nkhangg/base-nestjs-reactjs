# Module: core/admin-shell

## Mục đích
Glue layer: kết nối các domain feature modules với admin authentication + RBAC. Không chứa business logic — chỉ wiring.

## Cấu trúc
```
core/admin-shell/
├── admin.interface.ts            # AdminFeature interface + ADMIN_FEATURE token
├── admin-auth.guard.ts           # AdminAuthGuard: JWT check + RBAC check
├── admin-route.registry.ts       # Đọc ADMIN_FEATURE multi-providers → build menu/permissions
├── require-permission.decorator.ts  # @RequirePermission(resource, action)
├── index.ts
└── admin-shell.module.ts         # AdminShellModule.forRoot() → global guard + registry
```

## AdminFeature Interface
```ts
export interface AdminFeature {
  resource: string;                          // dùng trong @RequirePermission
  controller: Type<any>;
  permissions: Array<'read' | 'create' | 'update' | 'delete' | ...>;
  menu: { label: string; icon: string; order: number };
}

export const ADMIN_FEATURE = Symbol('ADMIN_FEATURE');
```

## Đăng ký Feature mới
```ts
// presentation/my-feature/my.feature.ts
export const MyFeature: AdminFeature = {
  resource: 'my-resource',
  controller: MyController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: { label: 'My Feature', icon: 'icon-name', order: 5 },
}

// Trong module providers:
{ provide: ADMIN_FEATURE, useValue: MyFeature, multi: true }
```

## AdminAuthGuard
```ts
// Áp dụng ở controller hoặc method level:
@UseGuards(AdminAuthGuard)
@RequirePermission('my-resource', 'read')
```
Flow:
1. Đọc `req.user.adminRole` (set bởi `jwt.middleware`)
2. Nếu không có → 401
3. `AuthorizationService.can(subject, action, resource)` → nếu false → 403

## API Routes
Không có HTTP routes riêng. Module expose:
- `GET /admin/menu` — trả về menu items từ tất cả registered features (qua `AdminRouteRegistry`)
- `GET /admin/permissions` — trả về permissions của admin hiện tại
