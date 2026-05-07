# Module: modules/progress

## Mục đích
Admin xem activity log của bất kỳ user nào và bảng xếp hạng XP toàn hệ thống. Read-only analytics/monitoring page.

## Cấu trúc
```
modules/progress/
├── components/
│   ├── ProgressPage.tsx      # Tabs: Leaderboard + "Xem theo user"
│   └── UserProgressPanel.tsx # StatCards + DataTable activity log
├── hooks/
│   └── useProgress.ts        # useUserProgress(userId), useLeaderboard(period)
├── services/
│   └── progress.service.ts   # getUserActivityLogs, getLeaderboard
├── types/
│   └── index.ts              # ActivityLog, LeaderboardEntry, UserActivityResponse, LeaderboardResponse
└── index.ts
```

## Routes
| Route | Component | Guard |
|---|---|---|
| `/progress` | `ProgressPage` | `AdminGuard` |

## API Endpoints
| Method | Path | Service fn | Hook |
|---|---|---|---|
| GET | `/admin/progress/users/:id` | `getUserActivityLogs(userId)` | `useUserProgress(userId)` |
| GET | `/leaderboard?type=all-time\|weekly` | `getLeaderboard(type)` | `useLeaderboard(type)` |

## Query Keys
```ts
QUERY_KEYS.PROGRESS.USER_ACTIVITY   // ['progress', 'user-activity']
QUERY_KEYS.PROGRESS.LEADERBOARD     // ['progress', 'leaderboard']
```

## Hooks
- `useUserProgress(userId)` — enabled chỉ khi có userId, toast.error on error
- `useLeaderboard(type)` — `staleTime: 10 * 60 * 1000` (10 phút, ít thay đổi)

## UX Notes
- Tab mặc định: Leaderboard (không cần chọn user)
- Tab "Xem theo user": Select dropdown dùng `useUsers` từ `@modules/user` (load 100 users)
- Deep link: `?userId=xxx` → auto-select user và load UserProgressPanel
- UserProgressPanel: lazy load khi chọn user, StatCards show tổng XP và count logs

## Navigation
Sidebar: "Tiến độ" (BarChart2 icon, resource: 'progress-management') trong group "Nội dung học"
