# Module: modules/merchant

## Mục đích
Quản lý merchant accounts. Hiện tại là skeleton — chưa có use-cases hoặc controllers.

## Cấu trúc
```
modules/merchant/
└── merchant.module.ts    # Empty module, placeholder
```

## Seeded Roles

| Role | SubjectType | Parent | Permissions |
|---|---|---|---|
| base | merchant | — | notifications (r) |
| owner | merchant | base | `*` → all actions |

## Ghi chú
Module này sẽ được expand khi implement merchant features. Khi thêm:
1. Tạo đầy đủ `domain/`, `application/`, `infrastructure/`, `presentation/` theo Clean Architecture pattern
2. Implement `ICredentialValidator` với `subjectType = 'merchant'` để merchant login
3. Register validator vào `AuthModule.forRoot({ imports: [MerchantModule] })`
4. Seed merchant-specific roles trong `onModuleInit`
