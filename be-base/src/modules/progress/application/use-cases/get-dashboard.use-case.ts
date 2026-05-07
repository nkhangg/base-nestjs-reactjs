import { Inject, Injectable } from '@nestjs/common';
import type { ActivityLog } from '../../domain/entities/activity-log.entity';
import type { UserArticleProgress } from '../../domain/entities/user-article-progress.entity';
import {
  ACTIVITY_LOG_REPOSITORY,
  type IActivityLogRepository,
} from '../../domain/repositories/activity-log.repository';
import {
  USER_ARTICLE_PROGRESS_REPOSITORY,
  type IUserArticleProgressRepository,
} from '../../domain/repositories/user-article-progress.repository';
import {
  PROGRESS_USER_REPOSITORY,
  type IProgressUserRepository,
  type UserStats,
} from '../../domain/repositories/progress-user.repository';

export interface DashboardData {
  user: UserStats | null;
  dueFlashcardsCount: number;
  recentActivity: ActivityLog[];
  articleProgress: UserArticleProgress[];
}

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityRepo: IActivityLogRepository,
    @Inject(USER_ARTICLE_PROGRESS_REPOSITORY)
    private readonly articleProgressRepo: IUserArticleProgressRepository,
    @Inject(PROGRESS_USER_REPOSITORY)
    private readonly progressUserRepo: IProgressUserRepository,
  ) {}

  async execute(userId: string): Promise<DashboardData> {
    const [
      user,
      dueFlashcardsCount,
      { data: recentActivity },
      { data: articleProgress },
    ] = await Promise.all([
      this.progressUserRepo.getUserStats(userId),
      this.progressUserRepo.getDueFlashcardsCount(userId),
      this.activityRepo.listByUser({ userId, page: 1, pageSize: 10 }),
      this.articleProgressRepo.listByUser(userId, 1, 5),
    ]);

    return { user, dueFlashcardsCount, recentActivity, articleProgress };
  }
}
