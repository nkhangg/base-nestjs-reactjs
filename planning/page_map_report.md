# 📋 Báo cáo & Kế hoạch Thiết kế — Page Map

> **Ngày tổng hợp:** 06/05/2026
> **Nguồn:** `page_map.html`

---

## 📊 Tổng quan

| Hạng mục | Số trang |
|---|---|
| Public (chưa đăng nhập) | 4 |
| Onboarding flow | 2 |
| Core Learning (học tập chính) | 8 |
| Analytics & Progress | 3 |
| Account & Settings | 4 |
| B2B — Giáo viên / Trung tâm | 4 |
| **Tổng cộng** | **25 trang** |

### Trạng thái thiết kế

| Trạng thái | Số trang | Ghi chú |
|---|---|---|
| ✅ Hoàn thành | 14 | Đã có thiết kế |
| 🔲 Phase 2 | 11 | Chưa thiết kế |

---

## ✅ Chi tiết các trang đã hoàn thành (14 trang)

### 🌐 Public — Chưa đăng nhập
| Icon | Tên trang | Mô tả |
|---|---|---|
| 🏠 | Landing page | Hero, features, levels, testimonials, CTA |
| 💰 | Pricing page | Free vs Pro vs Team — bảng so sánh tính năng, FAQ |
| 🔐 | Đăng ký / Đăng nhập | Auth flow, Google OAuth, forgot password |
| 📣 | Blog / Resources | Bài viết học tiếng Nhật, tips, SEO traffic |

### 🎯 Onboarding Flow
| Icon | Tên trang | Mô tả |
|---|---|---|
| 🎯 | Onboarding quiz | Mục tiêu → trình độ → quiz → thời gian → lộ trình |
| ✉️ | Email verification | Xác nhận email sau đăng ký, resend OTP |

### 📚 Core Learning — Học tập chính
| Icon | Tên trang | Mô tả |
|---|---|---|
| ⊞ | Dashboard | Tổng quan, heatmap, module list, stats |
| 🃏 | Flashcard session | SRS 2 chiều, gõ tiếng Nhật, recognition mode, kết quả |
| 📝 | Ngữ pháp | Danh sách mẫu câu, bài học chi tiết, bài tập |
| 🏆 | Mock Test JLPT | Chọn cấp độ → thi → kết quả & phân tích |

### 📊 Analytics & Progress
| Icon | Tên trang | Mô tả |
|---|---|---|
| 📊 | Tiến độ chi tiết | Biểu đồ từng kỹ năng, retention rate, vocabulary growth |

### 👤 Account & Settings
| Icon | Tên trang | Mô tả |
|---|---|---|
| 👤 | Profile | Thông tin cá nhân, avatar, stats công khai |
| ⚙️ | Cài đặt | Thông báo, lộ trình, giao diện, ngôn ngữ UI |
| 💳 | Billing / Nâng cấp | Chọn gói, thanh toán, quản lý subscription |

---

## 🔲 Phase 2 — Các trang cần thiết kế tiếp (11 trang)

### 📚 Core Learning
| Icon | Tên trang | Mô tả |
|---|---|---|
| 📖 | Đọc hiểu | Bài đọc + từ điển nhúng, furigana toggle, ghi chú |
| 🤖 | AI Sensei — Hội thoại | Chat với AI, chọn kịch bản, sửa lỗi inline |
| 📔 | Nhật ký viết | Editor tiếng Nhật, AI sửa lỗi, lịch sử bài viết |
| 🔍 | Từ điển thông minh | Tra đa chiều, ví dụ câu thực, thêm vào deck |

### 📊 Analytics & Progress
| Icon | Tên trang | Mô tả |
|---|---|---|
| 🗺️ | Lộ trình học tập | Timeline N5→N1, milestone, dự báo ngày đạt mục tiêu |
| 🎮 | Leaderboard | Xếp hạng tuần, bạn bè, cùng cấp độ |

### 👤 Account & Settings
| Icon | Tên trang | Mô tả |
|---|---|---|
| 🏅 | Thành tích & Badges | Milestone đạt được, streak records, danh hiệu |

### 🟣 B2B — Giáo viên / Trung tâm
| Icon | Tên trang | Mô tả |
|---|---|---|
| 🗺️ | Teacher Dashboard | Quản lý lớp, theo dõi học viên, báo cáo nhóm |
| 📋 | Tạo giáo án | Soạn syllabus, giao bài tập, deadline |
| 👥 | Quản lý học viên | Danh sách lớp, tiến độ từng người, nhắn tin |
| 📈 | Báo cáo lớp học | Analytics toàn lớp, điểm yếu nhóm, xuất PDF |

---

## 🗓️ Kế hoạch thực hiện Phase 2

### Gợi ý thứ tự ưu tiên

#### 🔴 Ưu tiên cao — Hoàn thiện Core Learning
> Đây là giá trị cốt lõi của sản phẩm, cần thiết kế sớm để test với người dùng thực.

1. **Từ điển thông minh** — hỗ trợ các tính năng học đã có (flashcard, ngữ pháp)
2. **Đọc hiểu** — tính năng độc lập, nhiều người dùng kỳ vọng
3. **AI Sensei — Hội thoại** — điểm khác biệt lớn so với đối thủ
4. **Nhật ký viết** — bổ sung cho kỹ năng sản xuất ngôn ngữ

#### 🟡 Ưu tiên trung — Gamification & Retention
> Tăng tỷ lệ quay lại hàng ngày, giảm churn.

5. **Lộ trình học tập** (N5→N1 timeline) — giúp người dùng thấy "đích đến"
6. **Leaderboard** — cạnh tranh lành mạnh, tăng động lực
7. **Thành tích & Badges** — phần thưởng tâm lý, streak gamification

#### 🟣 Ưu tiên sau — B2B (mảng doanh thu mới)
> Cần nghiên cứu thêm user research với giáo viên trước khi thiết kế.

8. **Teacher Dashboard**
9. **Tạo giáo án**
10. **Quản lý học viên**
11. **Báo cáo lớp học**

---

### 📅 Timeline gợi ý

| Sprint | Thời gian | Trang thiết kế |
|---|---|---|
| Sprint 1 | Tuần 1–2 | Từ điển thông minh, Đọc hiểu |
| Sprint 2 | Tuần 3–4 | AI Sensei, Nhật ký viết |
| Sprint 3 | Tuần 5–6 | Lộ trình học tập, Leaderboard, Thành tích |
| Sprint 4 | Tuần 7–10 | B2B: Teacher Dashboard, Giáo án, Học viên, Báo cáo |

---

## 📝 Ghi chú & Rủi ro

- **AI Sensei & Nhật ký viết** phụ thuộc vào API AI — cần phối hợp sớm với backend để xác định scope.
- **B2B** là mảng riêng, nên có user interview với ít nhất 3–5 giáo viên trước khi bắt tay thiết kế.
- **Leaderboard** cần xác định: realtime hay batch? Global hay chỉ bạn bè? — ảnh hưởng đến thiết kế UX.
- Các trang **Phase 2 của Core Learning** nên được prototype low-fi và test với người dùng trước khi đi vào hi-fi.
