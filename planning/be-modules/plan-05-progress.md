# [BE] FEATURE PLAN — MODULE 5: progress (Tiến độ & Gamification)
> **Ngày:** 06/05/2026

---

## Mục đích

Tracking XP, streak, activity logs, reading progress cho articles, và dashboard analytics. Hub trung tâm tổng hợp dữ liệu từ các module khác.

---

## Domain

Files:
- CREATE `be-base/src/modules/progress/domain/entities/activity-log.entity.ts`
  — id, userId, actionType (read_article|quiz_done|flashcard_review|login), xpGained, referenceId, createdAt
- CREATE `be-base/src/modules/progress/domain/entities/user-article-progress.entity.ts`
  — userId, articleId, status (reading|completed), lastScrollPosition, completedAt
- CREATE `activity-log.repository.ts` — create, listByUser(userId, from, to), getStreakData(userId)
- CREATE `user-article-progress.repository.ts` — upsert, findByUser(userId, articleId), listByUser
- CREATE `be-base/src/modules/progress/domain/services/streak.service.ts`
  — `calculateStreak(activityDates[])`: đếm ngày liên tiếp từ hôm nay

---

## Application

Files:
- CREATE `log-activity.use-case.ts` — tạo log + cộng XP vào `users.xp_total` (atomic increment) + update `streak_count`
- CREATE `get-dashboard.use-case.ts` — xp, streak, due flashcards count, recent activity, article progress
- CREATE `get-detailed-progress.use-case.ts` — biểu đồ theo kỹ năng, XP timeline, heatmap data (activity by day)
- CREATE `update-article-progress.use-case.ts` — upsert reading position/status
- CREATE `get-leaderboard.use-case.ts` — top users by xp_total (weekly/all-time)

---

## Infrastructure

Files:
- CREATE `prisma-activity-log.repository.ts`
- CREATE `prisma-user-article-progress.repository.ts`
- CREATE mappers, in-memory repos

---

## Presentation

**User routes:**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/me/dashboard` | dashboard overview |
| GET | `/me/progress` | detailed progress + heatmap data |
| POST | `/me/articles/:id/progress` | update scroll position / mark done |
| GET | `/me/articles/:id/progress` | get reading progress |

**Public:**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/leaderboard` | top 50 users by XP (@Public) |

**Admin:**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/progress/users/:id` | view any user's activity log |

---

## Prisma Schema

```prisma
model ActivityLog {
  id          String   @id @default(uuid())
  userId      String
  actionType  String
  xpGained    Int      @default(0)
  referenceId String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@map("activity_logs")
}

model UserArticleProgress {
  userId             String
  articleId          String
  status             String   @default("reading")
  lastScrollPosition Int      @default(0)
  completedAt        DateTime?

  @@id([userId, articleId])
  @@index([userId])
  @@map("user_article_progresses")
}
```

**Migration name:** `create_progress_tables`

---

## Edge Cases

- **XP race condition:** dùng Prisma atomic `increment`, không `findFirst` rồi `update`
- **Leaderboard performance:** cần `@@index([xpTotal])` trên User model
- **Circular dependency:** progress cần flashcard data → dùng domain event hoặc query trực tiếp qua shared Prisma client (tránh import cross-module)
