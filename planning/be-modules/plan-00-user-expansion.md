# [BE] FEATURE PLAN — MODULE 0: Mở rộng User Model
> **Tiên quyết cho mọi module mới**
> **Ngày:** 06/05/2026

---

## Vấn đề

User Prisma model hiện tại thiếu 3 field cần cho gamification: `xp_total`, `streak_count`, `settings`.

## Thay đổi

- MODIFY `be-base/prisma/schema.prisma` — thêm vào model `User`:
  ```prisma
  xp_total     Int  @default(0)
  streak_count Int  @default(0)
  settings     Json @default("{}")
  ```
- MODIFY `be-base/src/modules/user/domain/entities/user.entity.ts` — thêm fields `xpTotal`, `streakCount`, `settings`
- MODIFY `be-base/src/modules/user/infrastructure/mappers/user.mapper.ts` — map các field mới

**Migration name:** `add_user_gamification_fields`
