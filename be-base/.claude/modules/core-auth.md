# Module: core/auth

## Mục đích
JWT authentication: login, logout, refresh token, session management. Không chứa business logic của admin/user — chỉ xử lý credentials và tokens.

## Cấu trúc
```
core/auth/
├── domain/
│   ├── entities/session.entity.ts
│   ├── repositories/session.repository.ts
│   └── services/
│       ├── token.service.ts                      # interface
│       ├── auth-identity.interface.ts             # { id, email, type, isAdmin? }
│       ├── credential-validator.interface.ts      # ICredentialValidator (email/password)
│       ├── oauth-identity-provider.interface.ts   # IOAuthIdentityProvider, OAuthUserInfo
│       └── oauth-user-connector.interface.ts      # IOAuthUserConnector (per account type)
├── application/use-cases/
│   ├── login.use-case.ts
│   ├── logout.use-case.ts
│   ├── refresh-token.use-case.ts
│   └── oauth-login.use-case.ts          # OAuth login — tìm/tạo user, phát session
├── infrastructure/
│   ├── jwt-token.service.ts
│   ├── jwt.middleware.ts             # Decode JWT → req.user (mọi request)
│   ├── refresh.middleware.ts
│   ├── auth.guard.ts                 # @Public() để bypass
│   ├── google-oauth.provider.ts      # IOAuthIdentityProvider cho Google
│   ├── discord-oauth.provider.ts     # IOAuthIdentityProvider cho Discord
│   └── repositories/
│       ├── in-memory-session.repository.ts
│       └── prisma-session.repository.ts
├── presentation/http/auth.controller.ts
└── auth.module.ts                    # AuthModule.forRoot({ jwt: {...}, imports: [...] })
```

## API Routes

| Method | Path | Mô tả |
|---|---|---|
| POST | `/auth/login` | Đăng nhập email/password → set HTTP-only cookie |
| POST | `/auth/oauth/login` | Đăng nhập OAuth (Google, Discord, ...) → set cookie |
| POST | `/auth/logout` | Xóa cookie, invalidate session |
| POST | `/auth/refresh` | Refresh access token dùng refresh cookie |

## Patterns

### AuthModule.forRoot()
AuthModule nhận config động và danh sách `CREDENTIAL_VALIDATORS` (multi-provider):
```ts
AuthModule.forRoot({
  jwt: { secret, accessExpiry: '15m', refreshExpiry: '30d' },
  imports: [AdminModule, UserModule],  // modules cung cấp validators
})
```

### ICredentialValidator (multi-provider)
Mỗi entity type (admin, user, merchant) implement `ICredentialValidator`:
```ts
export interface ICredentialValidator {
  readonly type: string;               // 'admin' | 'user' | 'merchant'
  validate(email: string, password: string): Promise<IAuthIdentity | null>;
}
// Inject:
@Inject(CREDENTIAL_VALIDATORS) private readonly validators: ICredentialValidator[]
```

### OAuth flow (IOAuthIdentityProvider + IOAuthUserConnector)
OAuth login dùng 2 extension points độc lập:

```ts
// 1. Provider interface — thêm provider mới: 1 file + 1 dòng trong auth.module.ts
export interface IOAuthIdentityProvider {
  readonly provider: string;  // 'google' | 'discord' | 'github' ...
  getUserInfo(accessToken: string): Promise<OAuthUserInfo | null>;
}
// Register: { provide: OAUTH_IDENTITY_PROVIDERS, useClass: XxxOAuthProvider, multi: true }

// 2. Connector interface — module nào muốn hỗ trợ OAuth thì đăng ký
export interface IOAuthUserConnector {
  readonly type: string;  // 'user' | 'merchant'
  findOrCreateFromOAuth(provider: string, info: OAuthUserInfo): Promise<IAuthIdentity>;
}
// Register trong UserModule: { provide: OAUTH_USER_CONNECTORS, useClass: UserOAuthConnector, multi: true }
// AdminModule KHÔNG đăng ký → admin không có OAuth
```

`OAuthLoginUseCase` guard: nếu `provider` hoặc `type` không có connector → `BadRequestException`.

### jwt.middleware.ts
Chạy **trước mọi request** — decode access token → set `req.user`:
```ts
req.user = { userId, subjectType, adminRole, ... }
```
Không throw nếu token không hợp lệ — để `auth.guard.ts` xử lý.

### Cookies
- `access_token`: 15 phút, httpOnly, sameSite strict
- `refresh_token`: 30 ngày, httpOnly, sameSite strict, path `/auth/refresh`
