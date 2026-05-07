Chỉnh sửa chi tiết nhỏ trên UI của một page/component trong dự án `client/` (Next.js App Router) — không cần tạo file mới hay thêm layer mới.

Dùng skill này khi: thay màu, đổi text, sửa spacing/layout, thêm/bớt element nhỏ, điều chỉnh style trong một component đã có.

## Arguments

`$ARGUMENTS` — format: `<target> <mô tả thay đổi>`

Trong đó `<target>` là một trong:

| Dạng | Ví dụ | Resolve thành |
|---|---|---|
| Module name | `landing` | `client/src/modules/landing/` |
| Module + component | `landing HeroSection` | `client/src/modules/landing/components/HeroSection.tsx` |
| Route path | `/register` | component trong `(auth)/register/` |
| Đường dẫn file trực tiếp | `client/src/shared/layouts/PublicLayout.tsx` | file đó |

Ví dụ args đầy đủ:
- `landing HeroSection đổi màu badge "Quên rồi" từ vermillion sang amber`
- `landing đổi text eyebrow "Học tiếng Nhật thông minh hơn" thành "Học Nhật ngữ với AI"`
- `PublicLayout thêm border-bottom dày hơn cho header`
- `/register đổi nút submit thành màu pine`
- `landing CTASection giảm padding trên/dưới từ py-20 xuống py-14`

---

## STEP 1 — Xác định file cần sửa

Parse `$ARGUMENTS`:
1. Tách `<target>` và `<mô tả thay đổi>`
2. Resolve target thành đường dẫn file(s) cụ thể:
   - Nếu là module name → đọc `client/.claude/modules/<module>.md` (nếu có) để xác định component liên quan
   - Nếu là module + component → thẳng đến `client/src/modules/<module>/components/<Component>.tsx`
   - Nếu là route path → tìm component tương ứng trong `client/src/app/`
   - Nếu là file path trực tiếp → dùng luôn

Luôn **đọc file target** trước khi sửa — không sửa mù.

---

## STEP 2 — Load context tối thiểu

Chỉ đọc những gì thực sự cần:

- Nếu thay màu/style → không cần đọc thêm gì (dùng Tailwind classes đã biết)
- Nếu thay text dùng i18n key → đọc `client/src/shared/i18n/locales/vi.json`
- Nếu sửa layout/structure phức tạp → đọc `client/.claude/CLAUDE.md` để check design rules
- Nếu thêm component mới → đọc `client/.claude/modules/shared-ui.md`

**Không đọc file nào nếu không cần thiết.**

---

## STEP 3 — Thực hiện thay đổi

Ngay sau khi đọc file và hiểu context:

1. **Tóm tắt 1 câu** những gì sẽ thay đổi (không cần approval — đây là tweak nhỏ)
2. **Dùng Edit tool** để sửa — chỉ thay đúng đoạn liên quan, không rewrite cả file
3. Nếu thay đổi liên quan đến i18n → cập nhật cả `vi.json` và `en.json`
4. Nếu thay đổi liên quan đến color token mới → verify token tồn tại trong `tailwind.config.js`

---

## STEP 4 — Verify

Chạy type-check sau khi sửa:

```bash
cd client && npm run type-check
```

Nếu có lỗi → fix ngay, không hỏi.

---

## Rules bắt buộc

- **Chỉ dùng Edit, không Write** (không rewrite cả file cho tweak nhỏ)
- **Dùng Tailwind classes** — không viết inline style trừ khi cần CSS variable hoặc giá trị động
- **Màu sắc dùng token** từ tailwind.config: `text-ink`, `bg-vermillion-light`, `text-pine`, v.v.
- **Không thêm comment** giải thích sự thay đổi vào code
- **Không thêm abstraction** không cần thiết — sửa trực tiếp vào chỗ cần sửa
- Nếu thay đổi yêu cầu tạo file mới hoặc thêm service/hook → báo user dùng `/client-page-from-ui` thay thế

---

## Scope check

Trước khi bắt đầu, nếu `<mô tả thay đổi>` yêu cầu bất kỳ điều nào sau đây → dừng lại và thông báo user nên dùng skill khác:

- Tạo component mới từ đầu
- Thêm API call / service / hook mới
- Thêm route mới
- Thêm module mới

Với những thay đổi nhỏ (text, màu, spacing, thêm/bớt 1-2 element trong file đã có) → tiến hành luôn.
