# [FE] FEATURE PLAN — MODULE 4: progress (Admin xem tiến độ học viên)
> **Ngày:** 07/05/2026

---

## Tóm tắt
Admin xem activity log của bất kỳ user nào (GET `/admin/progress/users/:id`) và
bảng xếp hạng XP toàn hệ thống (GET `/leaderboard`). Không có CRUD — read-only
analytics/monitoring page.

---

## Layer breakdown

### Types
Files:
- CREATE `fe-base-admin/src/modules/progress/types/index.ts`
  — `ActivityLog { id, userId, actionType: 'read_article'|'quiz_done'|'flashcard_review'|'login', xpGained, referenceId?, createdAt }`
  — `LeaderboardEntry { userId, username, avatarUrl?, xpTotal, rank }`
  — `UserProgressSummary { userId, xpTotal, streakCount, activityLogs: ActivityLog[] }`

### Service
Files:
- CREATE `fe-base-admin/src/modules/progress/services/progress.service.ts`
  — `getUserProgress(userId)` → GET `/admin/progress/users/:id`
  — `getLeaderboard(period?: 'weekly'|'all-time')` → GET `/leaderboard`

### Hooks
Files:
- CREATE `fe-base-admin/src/modules/progress/hooks/useProgress.ts`
  — `useUserProgress(userId)` → useQuery `QUERY_KEYS.PROGRESS.USER`
  — `useLeaderboard(period)` → useQuery `QUERY_KEYS.PROGRESS.LEADERBOARD`, `staleTime: 10 * 60 * 1000`

### Components
Files:
- CREATE `fe-base-admin/src/modules/progress/components/ProgressPage.tsx`
  — Tabs: "Leaderboard" + "Xem theo user"
  — Leaderboard tab: bảng top 50 (avatar, username, XP, rank badge), toggle weekly/all-time
  — Tab "Xem theo user": User selector dropdown (dùng service từ `@modules/user`) → load `UserProgressPanel`
- CREATE `fe-base-admin/src/modules/progress/components/UserProgressPanel.tsx`
  — `StatCard` row: XP total, streak count, tổng số activity
  — DataTable activity log: actionType, xpGained, referenceId, createdAt
  — Filter: actionType (select), date range

### Router & Navigation
Files:
- MODIFY `fe-base-admin/src/app/router.tsx`
  — Thêm `ProgressPage` route `/progress` trong AdminGuard + MainLayout
- MODIFY `fe-base-admin/src/config/routes.ts`
  — `PROGRESS: '/progress'`

### i18n
```
vi.json:
  progress.title: "Tiến độ học viên"
  progress.leaderboard: "Bảng xếp hạng"
  progress.xpTotal: "Tổng XP"
  progress.streak: "Chuỗi ngày"
  progress.activityLog: "Nhật ký hoạt động"
  progress.actionType.read_article: "Đọc bài"
  progress.actionType.quiz_done: "Làm bài kiểm tra"
  progress.actionType.flashcard_review: "Ôn thẻ học"
  progress.actionType.login: "Đăng nhập"
  progress.selectUser: "Chọn học viên"

en.json:
  progress.title: "Learner Progress"
  progress.leaderboard: "Leaderboard"
  progress.xpTotal: "Total XP"
  progress.streak: "Streak"
  progress.activityLog: "Activity Log"
  progress.actionType.read_article: "Read article"
  progress.actionType.quiz_done: "Completed quiz"
  progress.actionType.flashcard_review: "Flashcard review"
  progress.actionType.login: "Login"
  progress.selectUser: "Select learner"
```

---

## UX notes
- Loading: Skeleton `StatCard` row + Skeleton DataTable rows
- Error: `toast.error()` với retry nếu load user progress thất bại
- Empty: "Chưa có dữ liệu hoạt động" khi user chưa có log
- Leaderboard: tab mặc định khi vào trang, không cần userId
- `UserProgressPanel`: lazy load khi user chọn từ dropdown — không fetch khi mới vào trang

---

## Edge cases & risks
- User selector: không dùng raw ID input — dùng User select dropdown để tránh lỗi 404 khi nhập sai
- `/leaderboard` là public endpoint → không cần admin auth header; `staleTime` set cao (10m) vì ít thay đổi
- `ActivityLog` không có CRUD → không cần mutation hooks
- Nếu userId được truyền qua URL query param (`?userId=xxx`), `UserProgressPanel` nên auto-load để hỗ trợ deep link từ trang user management

---

## Effort estimate
| Layer | Effort |
|---|---|
| Types | Low |
| Service | Low |
| Hooks | Low |
| Components | Medium |
| Router | Low |
| **Total** | **Low-Medium** |

---

## Checklist khi implement
- [ ] Leaderboard dùng `staleTime: 10 * 60 * 1000`
- [ ] User selector dùng service từ `@modules/user` (không tự fetch lại)
- [ ] `UserProgressPanel` chỉ fetch khi có `userId` (không fetch khi undefined)
- [ ] New types defined in `types/index.ts`
- [ ] Service function added for each API call
- [ ] `useQuery` hooks có correct `queryKey` từ `QUERY_KEYS.PROGRESS.*`
- [ ] All user-facing strings dùng `useTranslation()`
- [ ] Thêm `QUERY_KEYS.PROGRESS` vào `src/shared/constants/index.ts`
- [ ] `fe-base-admin/.claude/modules/progress.md` tạo sau khi implement
