# NEW MODULE PLAN — ecom (E-Commerce)

> **Ngày:** 22/05/2026

---

## Tóm tắt

Module ecom xây dựng hệ thống thương mại điện tử multi-vendor trên nền base-nestjs-reactjs. Gồm 7 domain module độc lập theo Approach B (Separated Domain Modules): **merchant**, **product** (+ variants/SKU/categories), **inventory**, **cart**, **order**, **payment** (pluggable providers), **discount**. Cross-module communication qua EventBus đã có. RBAC đã hỗ trợ `subjectType: merchant`. Payment được thiết kế theo Strategy Pattern — thêm provider mới (SEAPAY, VNPay, banking...) không cần sửa core.

---

## Kiến trúc tổng quan

```
User/Guest → Cart → Checkout → Order → Payment (COD/Banking/SEAPAY/VNPay)
                                   ↓
                           Inventory deduct
                                   ↓
                        Merchant fulfillment
                                   ↓
                            Notification (existing)

Admin portal → quản lý Merchant, Product, Order, Discount, Inventory
Merchant portal → quản lý Product, Inventory, Order của shop mình
```

**Event flow:**
```
order.created      → notify user + merchant (IntegrationModule)
payment.confirmed  → deduct inventory + confirm order + notify
order.shipped      → notify user (tracking)
order.delivered    → notify user + prompt review
order.cancelled    → release inventory reservation + notify
```

---

## ━━ PRISMA SCHEMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Migration name: `add-ecom-module`

```prisma
// ── Merchant ──────────────────────────────────────────────────────

model Merchant {
  id          String   @id
  userId      String   @unique
  shopName    String
  slug        String   @unique
  description String?  @db.Text
  logoUrl     String?
  status      String   @default("pending") // pending|active|suspended
  settings    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products Product[]
  orders   Order[]

  @@index([status])
  @@map("merchants")
}

// ── Product ───────────────────────────────────────────────────────

model ProductCategory {
  id        String            @id
  parentId  String?
  parent    ProductCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  ProductCategory[] @relation("CategoryTree")
  name      String
  slug      String            @unique
  imageUrl  String?
  isActive  Boolean           @default(true)
  sortOrder Int               @default(0)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  products Product[]

  @@map("product_categories")
}

model Product {
  id          String           @id
  merchantId  String
  merchant    Merchant         @relation(fields: [merchantId], references: [id])
  categoryId  String?
  category    ProductCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  name        String
  slug        String           @unique
  description String?          @db.Text
  images      String[]
  status      String           @default("draft") // draft|active|archived
  tags        String[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  variants ProductVariant[]

  @@index([merchantId, status])
  @@index([categoryId])
  @@map("products")
}

model ProductVariant {
  id           String   @id
  productId    String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  name         String
  sku          String   @unique
  attributes   Json     @default("{}") // { "size": "S", "color": "Đỏ" }
  price        Int      // VND, đơn vị đồng
  comparePrice Int?
  images       String[]
  isDefault    Boolean  @default(false)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  inventory  Inventory?
  cartItems  CartItem[]
  orderItems OrderItem[]

  @@index([productId])
  @@map("product_variants")
}

// ── Inventory ─────────────────────────────────────────────────────

model Inventory {
  id        String         @id
  variantId String         @unique
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  quantity  Int            @default(0) // tổng tồn kho
  reserved  Int            @default(0) // đang giữ cho đơn pending
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  // available = quantity - reserved

  @@map("inventories")
}

model InventoryLog {
  id        String   @id
  variantId String
  delta     Int      // dương = nhập, âm = xuất
  reason    String   // 'restock'|'sale'|'reserve'|'release'|'adjust'|'return'
  orderId   String?
  note      String?
  createdAt DateTime @default(now())

  @@index([variantId])
  @@index([orderId])
  @@map("inventory_logs")
}

// ── Discount ──────────────────────────────────────────────────────

model Discount {
  id             String   @id
  code           String   @unique
  description    String?
  type           String   // 'percent'|'fixed'|'free_shipping'
  value          Int      // percent: 0-100, fixed: số tiền VND
  minOrderAmount Int      @default(0)
  maxUses        Int?     // null = không giới hạn
  usedCount      Int      @default(0)
  maxUsesPerUser Int      @default(1)
  validFrom      DateTime
  validTo        DateTime
  isActive       Boolean  @default(true)
  targetType     String   @default("all") // 'all'|'product'|'category'
  targetIds      String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  usages DiscountUsage[]

  @@index([code, isActive])
  @@map("discounts")
}

model DiscountUsage {
  id         String   @id
  discountId String
  discount   Discount @relation(fields: [discountId], references: [id])
  userId     String
  orderId    String
  amount     Int
  usedAt     DateTime @default(now())

  @@unique([discountId, userId, orderId])
  @@index([discountId])
  @@map("discount_usages")
}

// ── Cart ──────────────────────────────────────────────────────────

model Cart {
  id        String     @id
  userId    String?
  sessionId String?    // guest cart
  expiresAt DateTime
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  items CartItem[]

  @@index([userId])
  @@index([sessionId])
  @@map("carts")
}

model CartItem {
  id        String         @id
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
  price     Int            // snapshot giá lúc thêm vào giỏ
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([cartId, variantId])
  @@map("cart_items")
}

// ── Shipping Address ──────────────────────────────────────────────

model ShippingAddress {
  id        String   @id
  userId    String
  firstName String
  lastName  String
  phone     String
  address   String
  ward      String?
  district  String?
  city      String
  country   String   @default("VN")
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("shipping_addresses")
}

// ── Order ─────────────────────────────────────────────────────────

model Order {
  id              String   @id
  orderNumber     String   @unique // ORD-20260522-0001
  userId          String
  merchantId      String
  merchant        Merchant @relation(fields: [merchantId], references: [id])
  status          String   @default("pending")
  // State machine: pending→confirmed→processing→shipped→delivered
  //                pending/confirmed→cancelled
  //                delivered→refunded

  subtotal        Int
  discountAmount  Int      @default(0)
  shippingFee     Int      @default(0)
  total           Int

  discountCode    String?
  discountId      String?

  // Shipping address snapshot (không reference để tránh phụ thuộc)
  shippingName     String
  shippingPhone    String
  shippingAddress  String
  shippingWard     String?
  shippingDistrict String?
  shippingCity     String
  shippingCountry  String  @default("VN")

  paymentMethod    String  // 'cod'|'banking'|'seapay'|'vnpay'
  paymentStatus    String  @default("pending") // pending|paid|failed|refunded

  notes           String?
  confirmedAt     DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  items        OrderItem[]
  transactions PaymentTransaction[]

  @@index([userId, status])
  @@index([merchantId, status])
  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id          String         @id
  orderId     String
  order       Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  productName String         // snapshot
  variantName String         // snapshot
  sku         String         // snapshot
  price       Int
  quantity    Int
  total       Int

  @@index([orderId])
  @@map("order_items")
}

// ── Payment ───────────────────────────────────────────────────────

model PaymentTransaction {
  id          String    @id
  orderId     String
  order       Order     @relation(fields: [orderId], references: [id])
  method      String    // 'cod'|'banking'|'seapay'|'vnpay'
  status      String    // 'pending'|'processing'|'success'|'failed'|'refunded'
  amount      Int
  currency    String    @default("VND")
  externalId  String?   // ID từ payment gateway
  returnUrl   String?
  webhookData Json?     // raw webhook payload (audit trail)
  initiatedAt DateTime  @default(now())
  completedAt DateTime?
  failedAt    DateTime?
  failReason  String?

  @@index([orderId])
  @@index([externalId])
  @@map("payment_transactions")
}
```

---

## ━━ BACKEND (be-base) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Folder: `be-base/src/modules/` — thêm 7 module mới.

---

### MODULE 1: merchant

**Domain:**
```
modules/merchant/domain/
├── entities/merchant.entity.ts        # { id, userId, shopName, slug, status, settings }
└── repositories/merchant.repository.ts  # MERCHANT_REPOSITORY token
    # findById, findByUserId, findAll(page,search,status), save, delete
```

**Application use-cases:**
```
modules/merchant/application/use-cases/
├── create-merchant.use-case.ts    # Tạo merchant, auto assign merchant role cho user
├── update-merchant.use-case.ts    # Cập nhật thông tin shop
├── approve-merchant.use-case.ts   # Admin duyệt → status: active, emit merchant.approved
├── suspend-merchant.use-case.ts   # Admin suspend → status: suspended
├── get-merchant.use-case.ts
└── list-merchants.use-case.ts
```

**Seeded Roles (onModuleInit):**
```ts
{ name: 'merchant-owner', subjectType: 'merchant', permissions: { '*': ['create','read','update','delete'] } }
{ name: 'merchant-staff', subjectType: 'merchant', permissions: {
    'merchant-products': ['read','create','update'],
    'merchant-orders':   ['read','update'],
    'merchant-inventory':['read','update'],
}}
```

**API Routes:**

Admin (`/admin/merchants`):
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/merchants` | read |
| POST | `/admin/merchants` | create |
| GET | `/admin/merchants/:id` | read |
| PATCH | `/admin/merchants/:id` | update |
| POST | `/admin/merchants/:id/approve` | update |
| POST | `/admin/merchants/:id/suspend` | update |
| DELETE | `/admin/merchants/:id` | delete |

Merchant self (`/merchant/profile`) — MerchantPermissionGuard:
| Method | Path |
|---|---|
| GET | `/merchant/profile` |
| PATCH | `/merchant/profile` |

**Files to CREATE:**
- `modules/merchant/domain/entities/merchant.entity.ts`
- `modules/merchant/domain/repositories/merchant.repository.ts`
- `modules/merchant/application/use-cases/*.use-case.ts` (6 files)
- `modules/merchant/infrastructure/repositories/prisma-merchant.repository.ts`
- `modules/merchant/infrastructure/repositories/in-memory-merchant.repository.ts`
- `modules/merchant/infrastructure/mappers/merchant.mapper.ts`
- `modules/merchant/presentation/admin/merchant-admin.controller.ts`
- `modules/merchant/presentation/admin/merchant-admin.feature.ts`
- `modules/merchant/presentation/merchant/merchant-profile.controller.ts`
- `modules/merchant/merchant.module.ts`

**Files to MODIFY:**
- `be-base/src/app.module.ts` — import MerchantModule
- `be-base/src/core/auth/presentation/http/auth.controller.ts` — thêm `'merchant-management'` vào `ADMIN_NAV_RESOURCES`

---

### MODULE 2: product

**Domain:**
```
modules/product/domain/
├── entities/
│   ├── product.entity.ts          # { id, merchantId, categoryId, name, slug, status, images[], tags[] }
│   ├── product-variant.entity.ts  # { id, productId, sku, price, comparePrice, attributes, isDefault }
│   └── product-category.entity.ts # { id, parentId, name, slug, sortOrder }
└── repositories/
    ├── product.repository.ts          # PRODUCT_REPOSITORY
    ├── product-variant.repository.ts  # PRODUCT_VARIANT_REPOSITORY
    └── product-category.repository.ts # PRODUCT_CATEGORY_REPOSITORY
```

**Application use-cases:**
```
modules/product/application/use-cases/
├── create-product.use-case.ts         # Tạo product + default variant
├── update-product.use-case.ts
├── delete-product.use-case.ts         # soft-delete → archived
├── publish-product.use-case.ts        # draft → active
├── get-product.use-case.ts
├── list-products.use-case.ts          # filter: merchantId, categoryId, status, search
├── add-variant.use-case.ts            # thêm variant vào product
├── update-variant.use-case.ts
├── delete-variant.use-case.ts
├── create-category.use-case.ts
├── update-category.use-case.ts
├── delete-category.use-case.ts
└── list-categories.use-case.ts        # tree structure
```

**API Routes:**

Admin (`/admin/products`, `/admin/product-categories`):
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/products` | read |
| POST | `/admin/products` | create |
| GET | `/admin/products/:id` | read |
| PATCH | `/admin/products/:id` | update |
| DELETE | `/admin/products/:id` | delete |
| POST | `/admin/products/:id/publish` | update |
| POST | `/admin/products/:id/variants` | create |
| PATCH | `/admin/products/:id/variants/:variantId` | update |
| DELETE | `/admin/products/:id/variants/:variantId` | delete |
| GET/POST/PATCH/DELETE | `/admin/product-categories` | read/create/update/delete |

Merchant (`/merchant/products`) — MerchantPermissionGuard `merchant-products`:
Tương tự admin nhưng tự động filter theo `merchantId` của session.

Public (`/products`) — `@Public()`:
| Method | Path |
|---|---|
| GET | `/products` |
| GET | `/products/:slug` |
| GET | `/product-categories` |

**Files to CREATE:** ~18 files (entities, repos, use-cases, infra, controllers, feature)

---

### MODULE 3: inventory

**Thiết kế quan trọng — atomicity:**
Tất cả `reserve` / `deduct` / `release` phải dùng Prisma transaction với `$executeRaw` hoặc `UPDATE ... WHERE quantity - reserved >= delta` để tránh race condition.

**Application use-cases:**
```
modules/inventory/application/use-cases/
├── adjust-inventory.use-case.ts   # Admin nhập/xuất kho thủ công
├── reserve-inventory.use-case.ts  # Khi tạo order → tăng reserved
├── release-inventory.use-case.ts  # Khi cancel order → giảm reserved
├── deduct-inventory.use-case.ts   # Khi payment confirmed → giảm quantity + reserved
├── get-inventory.use-case.ts
└── list-inventory-logs.use-case.ts
```

**Atomic reserve pattern:**
```sql
UPDATE inventories
SET reserved = reserved + :delta
WHERE variant_id = :variantId
  AND (quantity - reserved) >= :delta
```
Nếu affected rows = 0 → throw `InsufficientStockException`.

**API Routes:**

Admin (`/admin/inventory`):
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/inventory` | read |
| GET | `/admin/inventory/:variantId` | read |
| POST | `/admin/inventory/:variantId/adjust` | update |
| GET | `/admin/inventory/:variantId/logs` | read |

Merchant (`/merchant/inventory`) — MerchantPermissionGuard:
Tương tự nhưng filter theo merchant.

---

### MODULE 4: discount

**Application use-cases:**
```
modules/discount/application/use-cases/
├── create-discount.use-case.ts
├── update-discount.use-case.ts
├── delete-discount.use-case.ts
├── list-discounts.use-case.ts
├── validate-discount.use-case.ts   # Input: code + userId + cartTotal → DiscountResult { valid, amount, reason }
└── record-discount-usage.use-case.ts  # Gọi sau khi order confirmed
```

**Validate logic:**
1. Tìm discount theo code, check `isActive`, `validFrom <= now <= validTo`
2. Check `usedCount < maxUses` (nếu maxUses != null)
3. Check user chưa dùng quá `maxUsesPerUser` lần
4. Check `cartTotal >= minOrderAmount`
5. Tính `amount`: percent → `floor(cartTotal * value / 100)`, fixed → `min(value, cartTotal)`, free_shipping → `shippingFee`

**API Routes:**

Admin (`/admin/discounts`):
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/discounts` | read |
| POST | `/admin/discounts` | create |
| GET | `/admin/discounts/:id` | read |
| PATCH | `/admin/discounts/:id` | update |
| DELETE | `/admin/discounts/:id` | delete |

Public/User (`/discounts/validate`):
| Method | Path |
|---|---|
| POST | `/discounts/validate` — { code, cartTotal } → { valid, amount, type, description } |

---

### MODULE 5: cart

**Thiết kế cart:**
- Guest cart: `sessionId` từ header `X-Session-ID` (FE tự generate UUID, lưu localStorage)
- Logged-in cart: `userId`
- Merge khi login: items từ guest cart append vào user cart (giữ quantity lớn hơn nếu conflict variant)
- Cart expire: 30 ngày, job cleanup định kỳ

**Application use-cases:**
```
modules/cart/application/use-cases/
├── get-or-create-cart.use-case.ts   # Lấy hoặc tạo cart theo userId/sessionId
├── add-to-cart.use-case.ts          # Thêm variant, check inventory available
├── update-cart-item.use-case.ts     # Cập nhật quantity
├── remove-cart-item.use-case.ts
├── clear-cart.use-case.ts
├── merge-cart.use-case.ts           # Guest → user cart sau login
└── apply-discount.use-case.ts       # Validate discount code trên cart
```

**API Routes — User/Guest:**
| Method | Path | Guard |
|---|---|---|
| GET | `/cart` | Optional auth (sessionId fallback) |
| POST | `/cart/items` | Optional auth |
| PATCH | `/cart/items/:variantId` | Optional auth |
| DELETE | `/cart/items/:variantId` | Optional auth |
| DELETE | `/cart` | Optional auth |
| POST | `/cart/merge` | UserPermissionGuard |
| POST | `/cart/discount` | Optional auth |

---

### MODULE 6: order

**State machine:**
```
pending → confirmed → processing → shipped → delivered
pending/confirmed → cancelled
delivered → refunded (partial or full)
```

**Transitions được phép:**
```ts
const TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped:    ['delivered'],
  delivered:  ['refunded'],
}
```

**Application use-cases:**
```
modules/order/application/use-cases/
├── create-order.use-case.ts          # Cart → Order, reserve inventory, emit order.created
├── confirm-order.use-case.ts         # Admin/merchant → confirmed
├── process-order.use-case.ts         # Merchant bắt đầu xử lý
├── ship-order.use-case.ts            # Merchant giao hàng, emit order.shipped
├── deliver-order.use-case.ts         # Confirm delivered, deduct inventory
├── cancel-order.use-case.ts          # Release reserved inventory, emit order.cancelled
├── refund-order.use-case.ts          # Đổi paymentStatus, emit order.refunded
├── get-order.use-case.ts
├── list-orders.use-case.ts           # Admin: tất cả, user: của mình, merchant: của shop
├── list-my-orders.use-case.ts
├── get-order-detail.use-case.ts
├── create-shipping-address.use-case.ts
├── list-shipping-addresses.use-case.ts
├── update-shipping-address.use-case.ts
└── delete-shipping-address.use-case.ts
```

**Domain Events published:**
- `order.created` → notify user + merchant
- `order.confirmed` → notify user
- `order.shipped` → notify user (có tracking info nếu có)
- `order.delivered` → notify user (prompt review)
- `order.cancelled` → notify user + merchant (release inventory)

**API Routes:**

Admin (`/admin/orders`):
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/orders` | read |
| GET | `/admin/orders/:id` | read |
| POST | `/admin/orders/:id/confirm` | update |
| POST | `/admin/orders/:id/cancel` | update |
| POST | `/admin/orders/:id/refund` | update |

Merchant (`/merchant/orders`):
| Method | Path |
|---|---|
| GET | `/merchant/orders` |
| GET | `/merchant/orders/:id` |
| POST | `/merchant/orders/:id/process` |
| POST | `/merchant/orders/:id/ship` |
| POST | `/merchant/orders/:id/deliver` |

User (`/orders`, `/shipping-addresses`):
| Method | Path |
|---|---|
| POST | `/orders` — checkout từ cart |
| GET | `/orders` |
| GET | `/orders/:id` |
| POST | `/orders/:id/cancel` |
| CRUD | `/shipping-addresses` |

---

### MODULE 7: payment (Pluggable Architecture)

**Thiết kế cốt lõi — Strategy Pattern:**

```ts
// payment/domain/ports/payment-provider.port.ts
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER')

export interface PaymentInitResult {
  transactionId: string
  redirectUrl?: string    // VNPay/SEAPAY cần redirect
  qrCode?: string         // banking QR
  instructions?: string   // COD: hướng dẫn
}

export interface PaymentVerifyResult {
  success: boolean
  externalId?: string
  failReason?: string
}

export interface IPaymentProvider {
  readonly method: PaymentMethod  // 'cod'|'banking'|'seapay'|'vnpay'
  initiatePayment(order: Order, metadata?: Record<string,unknown>): Promise<PaymentInitResult>
  verifyPayment(transactionId: string, webhookData?: unknown): Promise<PaymentVerifyResult>
  refundPayment(transactionId: string, amount: number): Promise<void>
}
```

**Providers (mỗi provider là 1 file injectable):**
```
modules/payment/infrastructure/providers/
├── cod.payment-provider.ts       # Không cần redirect, luôn pending cho đến khi giao hàng
├── banking.payment-provider.ts   # Tạo QR code / thông tin chuyển khoản, admin confirm thủ công
├── seapay.payment-provider.ts    # Tích hợp SEAPAY SDK
└── vnpay.payment-provider.ts     # Tích hợp VNPay SDK
```

**Registry pattern:**
```ts
// payment-provider.registry.ts
@Injectable()
export class PaymentProviderRegistry {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly providers: IPaymentProvider[],  // multi-provider
  ) {}

  get(method: PaymentMethod): IPaymentProvider {
    const p = this.providers.find(p => p.method === method)
    if (!p) throw new BadRequestException(`Unsupported payment method: ${method}`)
    return p
  }
}
```

**Thêm provider mới:** chỉ cần tạo class implements `IPaymentProvider`, đăng ký trong `PaymentModule.providers`:
```ts
{ provide: PAYMENT_PROVIDER, useClass: NewProvider, multi: true }
```
**Không cần sửa bất kỳ use-case hay controller nào.**

**Application use-cases:**
```
modules/payment/application/use-cases/
├── initiate-payment.use-case.ts     # Tạo PaymentTransaction, gọi provider.initiatePayment()
├── handle-webhook.use-case.ts       # Nhận webhook, gọi provider.verifyPayment(), update status
├── confirm-payment-manual.use-case.ts  # Admin confirm banking transfer
├── refund-payment.use-case.ts       # Gọi provider.refundPayment(), emit payment.refunded
└── get-payment-status.use-case.ts
```

**API Routes:**

User (`/payments`):
| Method | Path |
|---|---|
| POST | `/payments/initiate` — { orderId, method } → { redirectUrl?, qrCode?, instructions? } |
| GET | `/payments/:orderId/status` |

Webhook (`/payments/webhook/:provider`) — `@Public()`, verify signature per provider:
| Method | Path |
|---|---|
| POST | `/payments/webhook/vnpay` |
| POST | `/payments/webhook/seapay` |
| POST | `/payments/webhook/banking` |

Admin (`/admin/payments`):
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/payments` | read |
| POST | `/admin/payments/:id/confirm` | update — banking manual confirm |
| POST | `/admin/payments/:id/refund` | update |

---

### Integration handlers (core/integration)

Thêm vào `IntegrationModule`:
```
core/integration/handlers/
├── on-order-created.handler.ts       # @OnEvent('order.created') → notify user + merchant
├── on-order-shipped.handler.ts       # @OnEvent('order.shipped') → notify user
├── on-order-delivered.handler.ts     # @OnEvent('order.delivered') → notify user
├── on-order-cancelled.handler.ts     # @OnEvent('order.cancelled') → notify
├── on-payment-confirmed.handler.ts   # @OnEvent('payment.confirmed') → DeliverOrderUseCase + notify
└── on-merchant-approved.handler.ts   # @OnEvent('merchant.approved') → notify merchant owner
```

### Queue mới

Thêm vào `queue.constants.ts`:
```ts
PAYMENT: 'payment',   // async payment verification jobs
ORDER:   'order',     // order lifecycle jobs (auto-cancel after timeout, etc.)
```

---

### app.module.ts & auth.controller.ts

**app.module.ts** — imports thêm:
```ts
MerchantModule, ProductModule, InventoryModule,
DiscountModule, CartModule, OrderModule, PaymentModule
```

**auth.controller.ts** — ADMIN_NAV_RESOURCES thêm:
```ts
'merchant-management',
'product-management',
'order-management',
'discount-management',
'inventory-management',
```

---

## ━━ FRONTEND ADMIN (fe-base-admin) ━━━━━━━━━━━━━━━━━━━

5 module admin mới, tất cả trong `AdminGuard` group.

---

### FE Module 1: merchant (fe-base-admin)

**Types:**
```ts
// merchant/types/index.ts
interface Merchant { id, userId, shopName, slug, description, logoUrl, status, settings, createdAt }
type MerchantStatus = 'pending' | 'active' | 'suspended'
interface CreateMerchantDto { shopName, slug, description?, logoUrl? }
interface UpdateMerchantDto { shopName?, description?, logoUrl?, settings? }
```

**Components:**
- `MerchantPage.tsx` — DataTable: id, shopName, status badge, owner email, createdAt. Filter: status. Actions: approve, suspend, view
- `MerchantDetailDrawer.tsx` — Side drawer xem chi tiết + actions

**Routes:** `/admin/merchants` → `ROUTES.MERCHANTS`

---

### FE Module 2: product (fe-base-admin)

**Components:**
- `ProductPage.tsx` — DataTable với filter: merchant, category, status. Column: image thumbnail, name, SKU count, price range, status
- `ProductFormPage.tsx` — Full page (không phải modal) do form phức tạp: thông tin cơ bản + variants table + image uploader (dùng MediaPicker)
- `ProductCategoryPage.tsx` — DataTable categories + modal tạo/sửa
- `VariantTable.tsx` — Editable table cho variants (inline edit price, stock preview)

**MediaPicker tích hợp:** dùng `MediaPicker` từ `@modules/media` để chọn ảnh product.

**Routes:** `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/product-categories`

---

### FE Module 3: inventory (fe-base-admin)

**Components:**
- `InventoryPage.tsx` — DataTable: variant SKU, product name, quantity, reserved, available. Filter: merchant, low stock (available < threshold)
- `AdjustStockModal.tsx` — Form: delta (số lượng), reason, note
- `InventoryLogDrawer.tsx` — Lịch sử nhập xuất của 1 variant

**Routes:** `/admin/inventory`

---

### FE Module 4: order (fe-base-admin)

**Components:**
- `OrderPage.tsx` — DataTable: orderNumber, buyer, merchant, status badge, paymentStatus badge, total, createdAt. Filter: status, paymentStatus, dateRange
- `OrderDetailPage.tsx` — Full page: items list, shipping info, payment status, timeline của order status, action buttons (confirm/cancel/refund)
- `OrderTimelineComponent.tsx` — Visual timeline của order state changes

**Routes:** `/admin/orders`, `/admin/orders/:id`

---

### FE Module 5: discount (fe-base-admin)

**Components:**
- `DiscountPage.tsx` — DataTable: code, type, value, usedCount/maxUses, validFrom-validTo, isActive badge
- `DiscountModal.tsx` — Form tạo/sửa với: code, type (select), value, date range picker, minOrderAmount, maxUses

**Routes:** `/admin/discounts`

---

### Router + Navigation

**Files to MODIFY:**

`fe-base-admin/src/app/router.tsx` — thêm 7 lazy routes:
```ts
{ path: ROUTES.MERCHANTS, element: lazy(() => import('@modules/merchant').then(m => ({ default: m.MerchantPage }))) }
{ path: ROUTES.PRODUCTS, ... }
{ path: ROUTES.PRODUCTS_NEW, ... }
{ path: `${ROUTES.PRODUCTS}/:id/edit`, ... }
{ path: ROUTES.PRODUCT_CATEGORIES, ... }
{ path: ROUTES.INVENTORY, ... }
{ path: ROUTES.ORDERS, ... }
{ path: `${ROUTES.ORDERS}/:id`, ... }
{ path: ROUTES.DISCOUNTS, ... }
```

`fe-base-admin/src/config/routes.ts` — thêm:
```ts
MERCHANTS: '/admin/merchants',
PRODUCTS: '/admin/products',
PRODUCT_CATEGORIES: '/admin/product-categories',
INVENTORY: '/admin/inventory',
ORDERS: '/admin/orders',
DISCOUNTS: '/admin/discounts',
```

`fe-base-admin/src/shared/constants/index.ts` — QUERY_KEYS thêm:
```ts
MERCHANTS: { LIST: ['merchants'], DETAIL: (id) => ['merchants', id] },
PRODUCTS: { LIST: ['products'], DETAIL: (id) => ['products', id], CATEGORIES: ['product-categories'] },
INVENTORY: { LIST: ['inventory'], LOGS: (id) => ['inventory', id, 'logs'] },
ORDERS: { LIST: ['orders'], DETAIL: (id) => ['orders', id] },
DISCOUNTS: { LIST: ['discounts'], DETAIL: (id) => ['discounts', id] },
```

---

## ━━ FRONTEND CLIENT (client/) ━━━━━━━━━━━━━━━━━━━━━━━━

5 module mới cho storefront.

---

### Client Module 1: product (catalog)

**Components:**
- `ProductListPage.tsx` — Grid sản phẩm, filter: category, price range, search. Infinite scroll hoặc pagination
- `ProductDetailPage.tsx` — Ảnh gallery, variant picker (size/màu), price, add to cart button, stock status
- `ProductCard.tsx` — Card cho grid

**Routes (App Router):** `/(app)/products/page.tsx`, `/(app)/products/[slug]/page.tsx`

---

### Client Module 2: cart

**Components:**
- `CartPage.tsx` — Danh sách items, quantity controls, remove, discount code input, subtotal/total. Sidebar với order summary
- `CartDrawer.tsx` — Mini cart drawer mở từ header
- `CartIcon.tsx` — Header icon với badge count

**Hooks:** `useCart()`, `useAddToCart()`, `useUpdateCartItem()`, `useRemoveCartItem()`, `useApplyDiscount()`

**Routes:** `/(app)/cart/page.tsx`

---

### Client Module 3: checkout

**Components:**
- `CheckoutPage.tsx` — Multi-step: (1) Địa chỉ giao hàng, (2) Phương thức thanh toán, (3) Xác nhận
- `AddressStep.tsx` — Chọn địa chỉ đã lưu hoặc nhập mới
- `PaymentMethodStep.tsx` — Radio: COD, Chuyển khoản, SEAPAY, VNPay
- `OrderConfirmStep.tsx` — Review order + place order

**Routes:** `/(app)/checkout/page.tsx`

---

### Client Module 4: order (user)

**Components:**
- `MyOrdersPage.tsx` — Danh sách đơn hàng của user, filter: status
- `OrderDetailPage.tsx` — Chi tiết đơn, timeline status, cancel button (nếu còn được)

**Routes:** `/(app)/orders/page.tsx`, `/(app)/orders/[id]/page.tsx`

---

### Client Module 5: merchant (shop pages)

**Components:**
- `ShopPage.tsx` — Trang shop của merchant: banner, sản phẩm

**Routes:** `/(public)/shops/[slug]/page.tsx`

---

## ━━ THỨ TỰ IMPLEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement theo thứ tự dependency:

```
Phase 1 — Foundation
  1. Prisma schema + migration
  2. BE: merchant module
  3. BE: product module (categories + variants)
  4. BE: inventory module

Phase 2 — Commerce Core
  5. BE: discount module
  6. BE: cart module
  7. BE: order module
  8. BE: payment module (COD + banking trước, SEAPAY/VNPay sau)

Phase 3 — Integration
  9. IntegrationModule: thêm order/payment handlers
  10. queue.constants.ts: thêm PAYMENT + ORDER queue

Phase 4 — Admin UI
  11. FE admin: merchant, product, inventory, order, discount

Phase 5 — Client Storefront
  12. Client: product catalog, cart, checkout, orders
```

---

## ━━ EDGE CASES & RISKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Inventory race condition**: Nhiều user cùng mua variant cuối cùng → dùng Prisma `$executeRaw` với conditional UPDATE. Nếu rows affected = 0 → `InsufficientStockException` → cart phải refresh.

2. **Order total drift**: Giá variant có thể thay đổi sau khi user đã cho vào giỏ → snapshot `price` trong CartItem và OrderItem khi tạo. FE cần hiển thị cảnh báo nếu giá thay đổi khi checkout.

3. **Payment webhook idempotency**: VNPay/SEAPAY có thể gửi webhook trùng → `HandleWebhookUseCase` phải check `transaction.status` trước, chỉ process nếu còn `pending`.

4. **Cart merge conflict**: User có cart khách và cart đã đăng nhập đều có cùng variant → merge lấy `max(quantity)` hoặc `sum` tùy business rule. Cần clarify.

5. **COD payment flow**: COD không có webhook — `paymentStatus` chỉ đổi thành `paid` khi order delivered. Logic đặc biệt trong `DeliverOrderUseCase`.

6. **Merchant isolation**: Merchant chỉ thấy product/order của mình → tất cả Merchant-side use-case phải validate `order.merchantId === req.user.userId` (hoặc merchantId từ session). Thiếu check này → data leak nghiêm trọng.

7. **Slug collision**: Product và Merchant đều có slug unique → cần generate slug từ name + unique suffix để tránh 400 khi tạo.

---

## ━━ EFFORT ESTIMATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Phase | Phần | Effort |
|---|---|---|
| Phase 1 | Prisma schema + migration | Low |
| Phase 1 | BE merchant module | Medium |
| Phase 1 | BE product module | High (variants phức tạp) |
| Phase 1 | BE inventory module | Medium (atomic logic) |
| Phase 2 | BE discount module | Medium |
| Phase 2 | BE cart module | Medium (merge logic) |
| Phase 2 | BE order module | High (state machine + events) |
| Phase 2 | BE payment module | High (pluggable architecture + providers) |
| Phase 3 | Integration handlers | Low |
| Phase 4 | FE admin (5 modules) | High |
| Phase 5 | Client storefront (5 modules) | High |
| **Tổng** | | **~Very High (6–10 tuần full-stack)** |

---

## Checklist khi implement

### BE checklist
- [ ] Entity không import NestJS / Prisma
- [ ] Inventory mutations dùng Prisma transaction
- [ ] Payment webhook handlers check idempotency
- [ ] Order state transitions validated qua `OrderStatusMachine`
- [ ] Merchant isolation: mọi merchant-side use-case validate ownership
- [ ] `PAYMENT_PROVIDER` multi-provider binding đúng trong PaymentModule
- [ ] `ADMIN_NAV_RESOURCES` trong auth.controller.ts cập nhật
- [ ] `QUEUE_NAMES` thêm PAYMENT + ORDER
- [ ] Integration handlers đăng ký trong IntegrationModule
- [ ] seedRoles() cho merchant + admin permissions dùng upsert

### FE checklist
- [ ] MediaPicker tích hợp đúng cho product images
- [ ] Cart state persist qua sessionId (localStorage) cho guest
- [ ] Checkout multi-step form dùng React Hook Form + Zod
- [ ] Payment redirect flow (VNPay/SEAPAY) xử lý return URL
- [ ] Toàn bộ destructive actions (cancel order, delete product) có ConfirmDialog
- [ ] QUERY_KEYS thêm đủ cho tất cả modules
- [ ] ROUTES constants thêm đủ

### Module docs sau khi implement
- [ ] `be-base/.claude/modules/merchant.md`
- [ ] `be-base/.claude/modules/product.md`
- [ ] `be-base/.claude/modules/inventory.md`
- [ ] `be-base/.claude/modules/discount.md`
- [ ] `be-base/.claude/modules/cart.md`
- [ ] `be-base/.claude/modules/order.md`
- [ ] `be-base/.claude/modules/payment.md`
- [ ] `fe-base-admin/.claude/modules/merchant.md`
- [ ] `fe-base-admin/.claude/modules/product.md`
- [ ] `fe-base-admin/.claude/modules/order.md`
- [ ] `fe-base-admin/.claude/modules/discount.md`
- [ ] `fe-base-admin/.claude/modules/inventory.md`
