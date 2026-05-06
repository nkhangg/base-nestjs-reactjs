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
│       ├── token.service.ts              # interface
│       ├── auth-identity.interface.ts    # { id, passwordHash, subjectType }
│       └── credential-validator.interface.ts  # ICredentialValidator
├── application/use-cases/
│   ├── login.use-case.ts
│   ├── logout.use-case.ts
│   └── refresh-token.use-case.ts
├── infrastructure/
│   ├── jwt-token.service.ts
│   ├── jwt.middleware.ts             # Decode JWT → req.user (mọi request)
│   ├── refresh.middleware.ts
│   ├── auth.guard.ts                 # @Public() để bypass
│   └── repositories/
│       ├── in-memory-session.repository.ts
│       └── prisma-session.repository.ts
├── presentation/http/auth.controller.ts
└── auth.module.ts                    # AuthModule.forRoot({ jwt: {...}, imports: [...] })
```

## API Routes

| Method | Path | Mô tả |
|---|---|---|
| POST | `/auth/login` | Đăng nhập → set HTTP-only cookie |
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
  subjectType: string;                 // 'admin' | 'user' | 'merchant'
  validate(email: string, password: string): Promise<AuthIdentity | null>;
}
// Inject:
@Inject(CREDENTIAL_VALIDATORS) private readonly validators: ICredentialValidator[]
```

### jwt.middleware.ts
Chạy **trước mọi request** — decode access token → set `req.user`:
```ts
req.user = { userId, subjectType, adminRole, ... }
```
Không throw nếu token không hợp lệ — để `auth.guard.ts` xử lý.

### Cookies
- `access_token`: 15 phút, httpOnly, sameSite strict
- `refresh_token`: 30 ngày, httpOnly, sameSite strict, path `/auth/refresh`
