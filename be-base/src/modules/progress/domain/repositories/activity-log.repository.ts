import type { ActivityLog } from '../entities/activity-log.entity';

export const ACTIVITY_LOG_REPOSITORY = Symbol('ACTIVITY_LOG_REPOSITORY');

export interface ListActivityLogsOptions {
  userId: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export interface IActivityLogRepository {
  create(log: ActivityLog): Promise<void>;
  listByUser(
    opts: ListActivityLogsOptions,
  ): Promise<{ data: ActivityLog[]; total: number }>;
  getActivityDates(userId: string, from: Date, to: Date): Promise<Date[]>;
  getXpSumByUser(userIds: string[], since: Date): Promise<Map<string, number>>;
}
