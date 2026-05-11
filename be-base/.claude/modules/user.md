# Module: modules/user

## Mục đích
Quản lý user accounts. Implement `ICredentialValidator` để AuthModule xác thực user login.
Hỗ trợ gamification fields: `xpTotal`, `streakCount`, `settings` dùng bởi progress module.

## Cấu trúc
```
modules/user/
├── domain/
│   ├── entities/user.entity.ts           # firstName, lastName (không còn name)
│   ├── repositories/user.repository.ts   # USER_REPOSITORY symbol + findByOAuthProvider/saveOAuthAccount
│   └── value-objects/user-id.vo.ts
├── application/use-cases/
│   ├── create-user.use-case.ts
│   ├── get-user.use-case.ts
│   ├── list-users.use-case.ts
│   ├── update-user-role.use-case.ts
│   ├── deactivate-user.use-case.ts
│   └── user-oauth-connector.service.ts   # IOAuthUserConnector cho type='user'
├── infrastructure/
│   ├── mappers/user.mapper.ts
│   ├── user-profile-provider.ts          # IProfileProvider với firstName/lastName
│   └── repositories/
│       ├── in-memory-user.repository.ts
│       └── prisma-user.repository.ts
├── presentation/user/
│   ├── user-management.controller.ts    # /admin/users (AdminAuthGuard)
│   └── user-management.feature.ts
└── user.module.ts    # Seed USER_ROLES, register UserOAuthConnector (OAUTH_USER_CONNECTORS)
```

## API Routes (`/admin/users`)

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/users` | read |
| POST | `/admin/users` | create |
| GET | `/admin/users/:id` | read |
| PATCH | `/admin/users/:id/role` | update |
| DELETE | `/admin/users/:id` | delete |

## Seeded Roles

| Role | SubjectType | Parent | Resources |
|---|---|---|---|
| base | user | — | notifications (r) |
| member | user | base | profile (r/u), orders (c/r), reviews (c/r/u/d), wishlist (c/r/d), notifications (r/u) |

## Domain Model — Profile Fields
| Field | Type | Mô tả |
|---|---|---|
| `firstName` | `string \| null` | Tên (đổi từ `name`) |
| `lastName` | `string \| null` | Họ (mới thêm) |
| `hasPassword` | `boolean` (getter) | `false` cho OAuth-only users (passwordHash = '') |

`User.createFromOAuth({email, firstName?, lastName?, avatarUrl?})` — tạo user không có password.

## Domain Model — Gamification Fields
| Field | Type | Default | Mô tả |
|---|---|---|---|
| `xpTotal` | `number` | 0 | Tổng XP tích lũy — dùng Prisma atomic `increment` khi cộng |
| `streakCount` | `number` | 0 | Số ngày học liên tiếp |
| `settings` | `Record<string, unknown>` | {} | User preferences (JSON) |

**Mutation methods:**
- `user.addXp(amount)` — cộng XP (amount <= 0 bị bỏ qua)
- `user.updateStreak(count)` — set streak mới
- `user.updateSettings(patch)` — shallow merge vào settings hiện tại

## Domain Events Published
- `user.created` — sau khi tạo user thành công
- `user.deactivated` — sau khi deactivate user

## Bật Google OAuth login
OAuth scaffolding (controller, use-case, connector, Prisma `OAuthAccount`) đã sẵn sàng — xem `core-auth.md`.
Để bật provider Google cho `type='user'`:
1. Google Cloud Console → APIs & Services → Credentials → tạo OAuth 2.0 Client ID (Web application).
   - Authorized JavaScript origins: domain FE (dev + prod).
2. Đặt `GOOGLE_CLIENT_ID` trong `.env` của BE (xem `.env.example`). Production thiếu env này sẽ từ chối login.
3. `GoogleOAuthProvider` verify `aud` qua `https://oauth2.googleapis.com/tokeninfo` để chặn token replay từ app khác, và reject `email_verified=false`.
4. FE lấy `access_token` (Google Identity Services) → POST `/auth/oauth/login` body `{ provider:'google', accessToken, type:'user', deviceName? }`. Lần đầu tự tạo user + assign role `member`, lần sau link qua `OAuthAccount(provider, providerId)`.
