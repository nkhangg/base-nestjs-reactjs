Phân tích yêu cầu, đề xuất các hướng tiếp cận, và so sánh trade-off cho một feature — trước khi lên kế hoạch hoặc implement.

## Arguments

`$ARGUMENTS` — format: `[be|fe|be:<module>|fe:<module>] <feature description>`

Examples:
- `be:user export danh sách user ra CSV`
- `fe:dictionary thêm tính năng lọc theo loại từ`
- `be rate limiting cho public API`
- `fe trang dashboard hiển thị thống kê học tập`
- `be:article hệ thống comment phân cấp`

Parse:
- **Scope prefix** (optional): `be`, `fe`, `be:<module>`, `fe:<module>`
  - Nếu có `<module>`: load module doc tương ứng trước
  - Nếu chỉ `be` hoặc `fe`: thảo luận ở mức kiến trúc, không cần module doc cụ thể
  - Nếu không có prefix: tự suy luận từ feature description
- **Feature description**: mô tả tự do bằng bất kỳ ngôn ngữ nào

---

## Steps to execute

### STEP 1 — Load context (nếu có module cụ thể)

Nếu scope prefix chứa `<module>`:
- Đọc `be-base/.claude/modules/<module>.md` (nếu prefix là `be:<module>`)
- Đọc `fe-base-admin/.claude/modules/<module>.md` (nếu prefix là `fe:<module>`)
- Nếu file không tồn tại: tiếp tục mà không cần dừng lại, ghi chú là không tìm thấy module doc

Đọc thêm các core docs liên quan nếu feature description gợi ý:
- Auth/session → `be-base/.claude/modules/core-auth.md`
- Permissions/roles → `be-base/.claude/modules/core-authorization.md`
- Background jobs → `be-base/.claude/modules/core-queue.md`
- Domain events → `be-base/.claude/modules/core-events.md`

---

### STEP 2 — Phân tích yêu cầu

Trước khi đề xuất hướng tiếp cận, phân tích feature một cách kỹ lưỡng:

- **Mục tiêu cốt lõi**: feature này thực sự cần đạt được gì?
- **Actors & triggers**: ai dùng, khi nào trigger, input/output là gì?
- **Constraints ẩn**: giới hạn performance, security, UX, hoặc business rule nào có thể ảnh hưởng?
- **Ambiguities**: liệt kê những điều chưa rõ — nhưng KHÔNG dừng lại để hỏi, hãy đưa ra giả định hợp lý và ghi rõ

---

### STEP 3 — Đề xuất các hướng tiếp cận

Đề xuất **2–4 hướng tiếp cận** khác nhau (không phải chỉ là biến thể nhỏ). Mỗi hướng phải có tên ngắn gọn và rõ ràng.

Ví dụ cách đặt tên: "Approach A: Sync processing", "Approach B: Queue-based async", "Approach C: Third-party service"

Với mỗi hướng, mô tả:
- Cách hoạt động ở mức cao (2–4 câu)
- Các thành phần chính cần thay đổi hoặc thêm mới
- Độ phức tạp triển khai: Thấp / Trung / Cao

---

### STEP 4 — So sánh trade-off

In bảng so sánh các tiêu chí quan trọng nhất với feature này. Chọn **4–6 tiêu chí** phù hợp nhất (không cần dùng hết):

Tiêu chí gợi ý: Độ phức tạp impl, Hiệu năng, Khả năng scale, Độ trễ (latency), Consistency, Maintainability, Thời gian phát triển, Phụ thuộc bên ngoài, Khả năng test, UX/trải nghiệm người dùng

---

### STEP 5 — Khuyến nghị

Đưa ra một khuyến nghị rõ ràng kèm lý do. Không mơ hồ kiểu "tùy trường hợp".

---

### STEP 6 — Câu hỏi làm rõ (nếu cần)

Nếu có giả định quan trọng ảnh hưởng lớn đến lựa chọn hướng tiếp cận, liệt kê tối đa 3 câu hỏi ngắn gọn để làm rõ.

---

## Output format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 THẢO LUẬN FEATURE
 Scope  : <be | fe | be:<module> | fe:<module>>
 Feature: <feature description>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phân tích yêu cầu

**Mục tiêu cốt lõi:** <1–2 câu>

**Actors & triggers:**
- <actor>: <hành động / trigger / expected output>

**Constraints ẩn:**
- <constraint>

**Giả định đã đưa ra:**
- <giả định> _(ghi rõ nếu chưa chắc)_

---

## Các hướng tiếp cận

### Approach A: <tên>
<Mô tả ngắn gọn cách hoạt động>

Thành phần thay đổi:
- <thành phần>

Độ phức tạp: Thấp / Trung / Cao

---

### Approach B: <tên>
<Mô tả ngắn gọn>

Thành phần thay đổi:
- <thành phần>

Độ phức tạp: Thấp / Trung / Cao

---

_(thêm approach C, D nếu có)_

---

## So sánh trade-off

| Tiêu chí | Approach A | Approach B | Approach C |
|---|---|---|---|
| <tiêu chí 1> | | | |
| <tiêu chí 2> | | | |
| <tiêu chí 3> | | | |
| <tiêu chí 4> | | | |

---

## Khuyến nghị

**Chọn Approach X** vì <lý do cụ thể dựa trên context của project này>.

<1–2 câu về điều kiện nên xem xét lại lựa chọn này>

---

## Câu hỏi làm rõ _(nếu cần)_

1. <câu hỏi>
2. <câu hỏi>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Để lên kế hoạch implement, chạy:
  /be-plan-feature <module> <feature>   (cho backend)
  /fe-plan-feature <module> <feature>   (cho frontend)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do NOT implement anything. Do NOT produce a detailed file-by-file plan. Stop after printing the discussion output.
