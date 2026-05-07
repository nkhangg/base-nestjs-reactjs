import { Inject, Injectable } from '@nestjs/common';
import {
  ACTIVITY_LOG_REPOSITORY,
  type IActivityLogRepository,
} from '../../domain/repositories/activity-log.repository';
import {
  PROGRESS_USER_REPOSITORY,
  type IProgressUserRepository,
} from '../../domain/repositories/progress-user.repository';

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface DetailedProgressData {
  xpTotal: number;
  streakCount: number;
  heatmap: HeatmapDay[];
  totalActivityDays: number;
}

@Injectable()
export class GetDetailedProgressUseCase {
  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityRepo: IActivityLogRepository,
    @Inject(PROGRESS_USER_REPOSITORY)
    private readonly progressUserRepo: IProgressUserRepository,
  ) {}

  async execute(userId: string): Promise<DetailedProgressData> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [userStats, activityDates] = await Promise.all([
      this.progressUserRepo.getUserStats(userId),
      this.activityRepo.getActivityDates(userId, oneYearAgo, new Date()),
    ]);

    const countByDay = new Map<string, number>();
    for (const date of activityDates) {
      const key = date.toISOString().slice(0, 10);
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }

    const heatmap: HeatmapDay[] = Array.from(countByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      xpTotal: userStats?.xpTotal ?? 0,
      streakCount: userStats?.streakCount ?? 0,
      heatmap,
      totalActivityDays: countByDay.size,
    };
  }
}
