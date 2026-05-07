import { Inject, Injectable } from '@nestjs/common';
import {
  PROGRESS_USER_REPOSITORY,
  type IProgressUserRepository,
  type LeaderboardEntry,
} from '../../domain/repositories/progress-user.repository';
import {
  ACTIVITY_LOG_REPOSITORY,
  type IActivityLogRepository,
} from '../../domain/repositories/activity-log.repository';

export type LeaderboardType = 'all-time' | 'weekly';

export interface GetLeaderboardInput {
  type: LeaderboardType;
  limit?: number;
}

@Injectable()
export class GetLeaderboardUseCase {
  constructor(
    @Inject(PROGRESS_USER_REPOSITORY)
    private readonly progressUserRepo: IProgressUserRepository,
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityRepo: IActivityLogRepository,
  ) {}

  async execute(input: GetLeaderboardInput): Promise<LeaderboardEntry[]> {
    const limit = input.limit ?? 50;

    if (input.type === 'weekly') {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      return this.progressUserRepo.getTopByXpWeekly(limit, since);
    }

    return this.progressUserRepo.getTopByXpAllTime(limit);
  }
}
