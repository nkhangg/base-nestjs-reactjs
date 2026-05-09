# [BE] FEATURE PLAN — contacts: Tách cột `note` và `replyMessage`
> **Ngày:** 09/05/2026

---

## Tóm tắt
Hiện tại method `reply()` trong entity ghi đè `note` bằng `replyMessage`
(`this.props.note = replyMessage`) khiến 2 khái niệm bị lẫn vào nhau — admin
không thể ghi chú nội bộ độc lập với nội dung email đã reply. Feature này thêm
cột `replyMessage` riêng trên DB, sửa entity/mapper/controller để tách bạch rõ
ràng, và thêm một migration SQL để chuyển dữ liệu lịch sử.

---

## Layer breakdown

### Domain
Sửa entity: thêm `replyMessage` vào `ContactProps`, fix method `reply()` không
ghi vào `note` nữa, thêm getter `replyMessage`.

Files:
- MODIFY `be-base/src/modules/contacts/domain/entities/contact.entity.ts`
  - `ContactProps`: thêm `replyMessage: string | null`
  - `Contact.create()`: khởi tạo `replyMessage: null`
  - `Contact.reply()`: `this.props.replyMessage = replyMessage`
    (xóa dòng `this.props.note = replyMessage`)
  - thêm getter `get replyMessage(): string | null`

### Application
Không cần thay đổi — `ReplyToContactUseCase` vẫn gọi `contact.reply(input.replyMessage)`,
`ContactRepliedEvent` vẫn nhận `replyMessage` từ input. Behavior không đổi.

Files: No changes needed

### Infrastructure

**Mapper** — thêm `replyMessage` vào `ContactRecord` interface, map trong `toDomain()`
và `toPrisma()`:
- MODIFY `be-base/src/modules/contacts/infrastructure/mappers/contact.mapper.ts`
  - `ContactRecord`: thêm `replyMessage: string | null`
  - `toDomain()`: truyền `replyMessage: r.replyMessage`
  - `toPrisma()`: trả về `replyMessage: contact.replyMessage`

**In-memory repo** — không cần sửa (lưu trực tiếp entity object, tự nhận
field mới sau khi entity thay đổi).

### Presentation
Thêm `replyMessage` vào `mapContact()` để API trả ra field mới:
- MODIFY `be-base/src/modules/contacts/presentation/admin/contacts-admin.controller.ts`
  - hàm `mapContact(c: Contact)`: thêm `replyMessage: c.replyMessage`

---

## Prisma schema

```prisma
model Contact {
  id           String        @id @default(cuid())
  firstName    String
  lastName     String
  email        String
  phone        String?
  subject      String
  message      String        @db.Text
  status       ContactStatus @default(PENDING)
  note         String?       @db.Text
  replyMessage String?       @db.Text    // ← thêm mới
  respondedAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([status])
  @@index([createdAt])
  @@map("contacts")
}
```

Migration name: `add_reply_message_to_contacts`

Migration phải có thêm **custom SQL** để migrate dữ liệu lịch sử (các contact
RESPONDED cũ đang lưu reply text trong cột `note`):

```sql
-- Di chuyển nội dung reply từ note → replyMessage cho các contact đã RESPONDED
UPDATE contacts
SET "replyMessage" = note
WHERE status = 'RESPONDED' AND note IS NOT NULL;

-- Xóa note của những contact đó vì note đã được chuyển sang replyMessage
UPDATE contacts
SET note = NULL
WHERE status = 'RESPONDED';
```

---

## FE cần update sau khi BE deploy

- MODIFY `fe-base-admin/src/modules/contacts/types/index.ts`
  — thêm `replyMessage: string | null` vào interface `Contact`

- MODIFY `fe-base-admin/src/modules/contacts/components/ContactDetailDialog.tsx`
  — Reply tab: đọc `contact.replyMessage` thay vì `contact.note`
  — Manage tab: xóa hint amber "Ghi chú là nội dung reply" (không còn cần thiết)

---

## Edge cases & risks

- **Data migration một chiều**: SQL migration sẽ copy `note → replyMessage` cho tất cả
  RESPONDED contacts và xóa `note`. Nếu admin đã ghi chú nội bộ cho một contact RESPONDED
  (không phải reply), note đó sẽ bị mất. Trong codebase hiện tại điều này không thể xảy ra
  vì `reply()` ghi đè `note` hoàn toàn — nhưng cần lưu ý nếu có data nhập tay trực tiếp DB.

- **Migration rollback**: Sau khi chạy SQL migration, rollback sẽ mất data vì `note` đã bị
  NULL. Nên backup trước hoặc dùng `--create-only` để review migration SQL trước khi apply.

- **FE cần update song song**: Sau khi BE deploy, FE phải update `Contact` type để thêm
  `replyMessage: string | null`, và sửa `ContactDetailDialog` để đọc `contact.replyMessage`
  thay vì `contact.note` trong Reply tab, đồng thời xóa hint amber "Ghi chú là nội dung reply".
  Nếu deploy BE trước khi FE update, reply tab tạm thời sẽ hiển thị trống (vì `contact.note`
  không còn chứa reply text nữa).

---

## Effort estimate
| Layer | Effort |
|---|---|
| Domain | Low |
| Application | — |
| Infrastructure | Low |
| Presentation | Low |
| **Total** | **Low** |

---

## Checklist khi implement

- [ ] `ContactProps` có `replyMessage: string | null`
- [ ] `Contact.create()` khởi tạo `replyMessage: null`
- [ ] `Contact.reply()` không còn ghi vào `note`
- [ ] Getter `replyMessage` được thêm vào entity
- [ ] `ContactRecord` interface trong mapper có `replyMessage`
- [ ] `toDomain()` và `toPrisma()` đều map `replyMessage`
- [ ] `mapContact()` trong controller trả ra `replyMessage`
- [ ] Migration SQL chạy đúng thứ tự: thêm cột → copy data → xóa data cũ
- [ ] Test với contact RESPONDED cũ: `replyMessage` có data, `note` là null
- [ ] Test với contact chưa reply: `replyMessage` là null, `note` hoạt động bình thường
- [ ] No domain layer files import from NestJS or Prisma
- [ ] FE `Contact` type thêm `replyMessage: string | null`
- [ ] FE Reply tab đọc `contact.replyMessage`, không còn dùng `contact.note`
- [ ] FE Manage tab xóa hint amber sau khi tách field
- [ ] `be-base/.claude/modules/contacts.md` updated after implementation
