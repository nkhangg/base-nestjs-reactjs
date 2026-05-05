# Plan: Nâng cấp Forgot Password — Token API → Gửi Mail

## Context

Chức năng quên mật khẩu hiện tại trả plain token thẳng trong API response (`{ token: "..." }`), đây là một security anti-pattern và đã có TODO comment nhắc chuyển sang gửi email. Mục tiêu: xóa token khỏi response, gửi reset link qua email, giữ nguyên toàn bộ logic verify token ở `/reset-password`.

---

## Approach

Inject `IMailerService` interface vào `ForgotPasswordUseCase` (direct injection, không dùng event-driven) — đơn giản, traceability cao, nhất quán với pattern `IPasswordUpdater` hiện có trong codebase.

Email library: `@nestjs-modules/mailer` + Nodemailer + Handlebars (template HTML).

---

## Backend Changes

### 1. Cài packages

```bash
cd be-base
npm install @nestjs-modules/mailer nodemailer handlebars
npm install --save-dev @types/nodemailer
```

### 2. Env vars

Thêm vào `be-base/.env` và `be-base/.env.example`:

```
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=
MAIL_PASS=
MAIL_FROM="No Reply <noreply@example.com>"
APP_URL=http://localhost:5173
```

### 3. File mới: Interface

**`be-base/src/core/auth/domain/services/mailer.interface.ts`** (mới)

```ts
export interface IMailerService {
  sendPasswordResetEmail(params: {
    to: string;
    resetLink: string;
  }): Promise<void>;
}
export const MAILER_SERVICE = Symbol("MAILER_SERVICE");
```

### 4. File mới: Implementation

**`be-base/src/core/auth/infrastructure/nodemailer-mailer.service.ts`** (mới)

```ts
@Injectable()
export class NodemailerMailerService implements IMailerService {
  constructor(private readonly mailer: MailerService) {}
  async sendPasswordResetEmail({
    to,
    resetLink,
  }: {
    to: string;
    resetLink: string;
  }) {
    await this.mailer.sendMail({
      to,
      subject: "Đặt lại mật khẩu",
      template: "reset-password",
      context: { resetLink, expiresInHours: 1 },
    });
  }
}
```

### 5. File mới: Email template

**`be-base/src/core/auth/infrastructure/templates/reset-password.hbs`** (mới)

- HTML email, 2 variables: `{{resetLink}}` và `{{expiresInHours}}`
- Nút "Đặt lại mật khẩu" link tới resetLink
- Fallback text link bên dưới

### 6. Sửa: `nest-cli.json`

Thêm vào `compilerOptions.assets` để copy `.hbs` vào `dist/`:

```json
{
  "compilerOptions": {
    "assets": [
      {
        "include": "core/auth/infrastructure/templates/**/*.hbs",
        "outDir": "dist"
      }
    ]
  }
}
```

### 7. Sửa: `auth.module.ts`

**File:** `be-base/src/core/auth/auth.module.ts`

- Import `MailerModule.forRoot(...)` với HandlebarsAdapter, đọc `process.env.MAIL_*`
- Template dir: `join(__dirname, 'infrastructure', 'templates')`
- Thêm provider: `NodemailerMailerService` + `{ provide: MAILER_SERVICE, useExisting: NodemailerMailerService }`

### 8. Sửa: `forgot-password.use-case.ts`

**File:** `be-base/src/core/auth/application/use-cases/forgot-password.use-case.ts`

Thay đổi:

- Xóa `ForgotPasswordOutput` interface (hoặc đổi thành `void`)
- Thêm `@Inject(MAILER_SERVICE) private readonly mailerService: IMailerService` vào constructor
- Sau `this.tokenRepo.save(entity)`, build `resetLink` và gọi mailerService (wrapped trong try/catch để SMTP failure không gây 500)
- Return `void` thay vì `{ token: plainToken }`

```ts
// Key logic thêm vào execute():
const appUrl = process.env.APP_URL ?? "http://localhost:5173";
const resetLink = `${appUrl}/reset-password?token=${plainToken}`;
try {
  await this.mailerService.sendPasswordResetEmail({
    to: input.email,
    resetLink,
  });
} catch (err) {
  this.logger.error(`Failed to send reset email for ${input.email}`, err);
}
```

### 9. Sửa: `auth.controller.ts`

**File:** `be-base/src/core/auth/presentation/http/auth.controller.ts`

- Handler `forgotPassword`: return `{ message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn reset mật khẩu' }`
- Xóa `...(result.token ? { token: result.token } : {})` spread
- Cập nhật `@ApiResponse` description

---

## Prisma (Optional nhưng khuyến nghị)

Thêm `userEmail String @default("")` vào `PasswordResetToken` model → chạy `prisma migrate dev`. Nếu thêm thì cần cập nhật `password-reset-token.entity.ts` (thêm field vào `generate()` và `reconstitute()`) và `prisma-password-reset-token.repository.ts`.

**Quyết định:** Thêm — migration zero-downtime, giúp debug incident mà không cần JOIN.

---

## Frontend Changes

### 1. Sửa: `types/index.ts`

**File:** `fe-base-admin/src/modules/auth/types/index.ts`

Xóa `token?: string` khỏi `ForgotPasswordResponse`:

```ts
export interface ForgotPasswordResponse {
  message: string;
}
```

### 2. Sửa: `ForgotPasswordPage.tsx`

**File:** `fe-base-admin/src/modules/auth/components/ForgotPasswordPage.tsx`

- Thay `resetToken` state (string | null) bằng `submitted` boolean
- Xóa `copied` state, `handleCopy` function
- Xóa import `Copy` từ lucide-react
- Đơn giản hóa `onSubmit`: `setSubmitted(true)` sau khi mutate thành công
- Thay toàn bộ `if (resetToken)` block bằng success screen cố định "Kiểm tra email"
- Link "Đặt lại mật khẩu" → `ROUTES.RESET_PASSWORD` (không có `?token=` vì user sẽ click link trong email)
- Giữ link "Quay lại đăng nhập"

> **Lưu ý:** `ResetPasswordPage.tsx` **không cần sửa** — vẫn đọc `?token=` từ URL và pre-fill field bình thường.

---

## Critical Files

| File                                                                                          | Thay đổi                                 |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `be-base/src/core/auth/domain/services/mailer.interface.ts`                                   | **Tạo mới**                              |
| `be-base/src/core/auth/infrastructure/nodemailer-mailer.service.ts`                           | **Tạo mới**                              |
| `be-base/src/core/auth/infrastructure/templates/reset-password.hbs`                           | **Tạo mới**                              |
| `be-base/src/core/auth/application/use-cases/forgot-password.use-case.ts`                     | Sửa — inject mailer, return void         |
| `be-base/src/core/auth/auth.module.ts`                                                        | Sửa — import MailerModule, wire provider |
| `be-base/src/core/auth/presentation/http/auth.controller.ts`                                  | Sửa — remove token from response         |
| `be-base/nest-cli.json`                                                                       | Sửa — add assets config                  |
| `be-base/prisma/schema.prisma`                                                                | Sửa — add userEmail field                |
| `be-base/src/core/auth/domain/entities/password-reset-token.entity.ts`                        | Sửa (nếu thêm userEmail)                 |
| `be-base/src/core/auth/infrastructure/repositories/prisma-password-reset-token.repository.ts` | Sửa (nếu thêm userEmail)                 |
| `fe-base-admin/src/modules/auth/types/index.ts`                                               | Sửa — remove token field                 |
| `fe-base-admin/src/modules/auth/components/ForgotPasswordPage.tsx`                            | Sửa — cleanup dev token display          |

---

## Thứ tự thực hiện

1. Cài packages
2. Thêm env vars
3. Tạo `mailer.interface.ts`
4. Tạo `reset-password.hbs` template
5. Tạo `NodemailerMailerService`
6. Sửa `nest-cli.json`
7. Sửa `auth.module.ts` (wire MailerModule)
8. Sửa `forgot-password.use-case.ts` (inject mailer, return void)
9. Sửa `auth.controller.ts` (remove token)
10. Prisma migration (nếu thêm userEmail)
11. Frontend cleanup

---

## Verification

1. Start backend `npm run start:dev` — không có DI error khi boot
2. POST `/auth/forgot-password` → response body chỉ có `{ message: "..." }`, không có `token`
3. SMTP server (MailHog `docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`) nhận được email
4. Click link trong email → `fe-base-admin/reset-password?token=<hex>` load đúng, token pre-filled
5. Complete reset → login với mật khẩu mới thành công
6. Dùng lại link → "Token không hợp lệ hoặc đã hết hạn"
7. Frontend: submit ForgotPasswordPage → success screen "Kiểm tra email", không có token display
