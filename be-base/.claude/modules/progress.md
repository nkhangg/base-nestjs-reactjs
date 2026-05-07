# Module: modules/progress

## Mục đích
Tracking XP, streak, activity logs, reading progress cho articles, và leaderboard. Hub trung tâm tổng hợp dữ liệu gamification từ các module khác.

## Cấu trúc
```
modules/progress/
├── domain/
│   ├── entities/
│   │   ├── activity-log.entity.ts           # { id, userId, actionType, xpGained, referenceId, createdAt }
│   │   └── user-article-progress.entity.ts  # { userId, articleId, status, lastScrollPosition, completedAt }
│   ├── value-objects/activity-log-id.vo.ts
│   ├── services/streak.service.ts           # calculateStreak(dates[]) → số ngày liên tiếp
│   └── repositories/
│       ├── activity-log.repository.ts       # ACTIVITY_LOG_REPOSITORY
│       ├── user-article-progress.repository.ts  # USER_ARTICLE_PROGRESS_REPOSITORY
│       └── progress-user.repository.ts      # PROGRESS_USER_REPOSITORY (accesses user + flashcard tables)
├── application/use-cases/
│   ├── log-activity.use-case.ts             # create log → atomic incrementXp → recalc streak
│   ├── get-dashboard.use-case.ts            # xp, streak, due flashcards, recent activity, article progress
│   ├── get-detailed-progress.use-case.ts    # heatmap, XP timeline
│   ├── update-article-progress.use-case.ts  # upsert reading position / mark completed
│   └── get-leaderboard.use-case.ts          # top 50 users (all-time | weekly)
├── infrastructure/
│   ├── mappers/
│   │   ├── activity-log.mapper.ts
│   │   └── user-article-progress.mapper.ts
│   └── repositories/
│       ├── prisma-activity-log.repository.ts
│       ├── prisma-user-article-progress.repository.ts
│       ├── prisma-progress-user.repository.ts   # atomic: prisma.user.update({ xpTotal: { increment } })
│       ├── in-memory-activity-log.repository.ts
│       ├── in-memory-user-article-progress.repository.ts
│       └── in-memory-progress-user.repository.ts
├── presentation/
│   ├── user/progress-user.controller.ts     # /me/dashboard, /me/progress, /me/articles/:id/progress
│   ├── public/progress-public.controller.ts # /leaderboard (@Public)
│   └── admin/
│       ├── progress-admin.controller.ts     # /admin/progress/users/:id (AdminAuthGuard)
│       └── progress-admin.feature.ts
└── progress.module.ts   # exports LogActivityUseCase, seeds progress-viewer role
```

## API Routes

### User (`/me`) — AuthGuard
| Method | Path | Mô tả |
|---|---|---|
| GET | `/me/dashboard` | Dashboard overview (xp, streak, due cards, recent activity) |
| GET | `/me/progress` | Detailed progress + heatmap data |
| POST | `/me/articles/:id/progress` | Update reading position / mark completed |
| GET | `/me/articles/:id/progress` | Get reading progress for article |

### Public
| Method | Path | Mô tả |
|---|---|---|
| GET | `/leaderboard` | Top 50 users by XP (`?type=all-time\|weekly`) |

### Admin (`/admin/progress`) — AdminAuthGuard + @RequirePermission
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/progress/users/:id` | read |

## ActionTypes
`'read_article' | 'quiz_done' | 'flashcard_review' | 'login'`

## Domain Model
- `ActivityLog.create({ userId, actionType, xpGained?, referenceId? })` — immutable after creation
- `UserArticleProgress.updatePosition(pos)` — update scroll position
- `UserArticleProgress.markCompleted()` — status = completed, completedAt = now
- `StreakService.calculateStreak(dates[])` — đếm ngày liên tiếp từ hôm nay ngược về quá khứ

## XP Atomic Increment
`PrismaProgressUserRepository.incrementXp()` dùng `prisma.user.update({ data: { xpTotal: { increment: amount } } })` — tránh race condition.

## Cross-module Access
`PrismaProgressUserRepository` truy cập `prisma.user` và `prisma.flashcard` trực tiếp qua shared PrismaService — không import từ user/flashcard module.

## Seeded Roles
| Role | SubjectType | Permissions |
|---|---|---|
| progress-viewer | admin | progress-management → read |

## Exports
- `LogActivityUseCase` — exported để các module khác có thể log activity (e.g., article module log read_article)
