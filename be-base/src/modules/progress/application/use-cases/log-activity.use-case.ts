import { Inject, Injectable } from '@nestjs/common';
import {
  ActivityLog,
  type ActionType,
} from '../../domain/entities/activity-log.entity';
import { StreakService } from '../../domain/services/streak.service';
import {
  ACTIVITY_LOG_REPOSITORY,
  type IActivityLogRepository,
} from '../../domain/repositories/activity-log.repository';
import {
  PROGRESS_USER_REPOSITORY,
  type IProgressUserRepository,
} from '../../domain/repositories/progress-user.repository';

export interface LogActivityInput {
  userId: string;
  actionType: ActionType;
  xpGained?: number;
  referenceId?: string;
}

@Injectable()
export class LogActivityUseCase {
  private readonly streakService = new StreakService();

  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityRepo: IActivityLogRepository,
    @Inject(PROGRESS_USER_REPOSITORY)
    private readonly progressUserRepo: IProgressUserRepository,
  ) {}

  async execute(input: LogActivityInput): Promise<void> {
    const log = ActivityLog.create({
      userId: input.userId,
      actionType: input.actionType,
      xpGained: input.xpGained ?? 0,
      referenceId: input.referenceId,
    });

    await this.activityRepo.create(log);

    if (log.xpGained > 0) {
      await this.progressUserRepo.incrementXp(input.userId, log.xpGained);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activityDates = await this.activityRepo.getActivityDates(
      input.userId,
      thirtyDaysAgo,
      new Date(),
    );

    const newStreak = this.streakService.calculateStreak(activityDates);
    await this.progressUserRepo.updateStreak(input.userId, newStreak);
  }
}
