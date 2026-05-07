import type { ActivityLog } from '../../domain/entities/activity-log.entity';
import type {
  IActivityLogRepository,
  ListActivityLogsOptions,
} from '../../domain/repositories/activity-log.repository';

export class InMemoryActivityLogRepository implements IActivityLogRepository {
  private readonly store: ActivityLog[] = [];

  async create(log: ActivityLog): Promise<void> {
    this.store.push(log);
  }

  async listByUser(
    opts: ListActivityLogsOptions,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    let results = this.store.filter((l) => l.userId === opts.userId);

    if (opts.from) results = results.filter((l) => l.createdAt >= opts.from!);
    if (opts.to) results = results.filter((l) => l.createdAt <= opts.to!);

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (opts.page - 1) * opts.pageSize;
    return { data: results.slice(skip, skip + opts.pageSize), total };
  }

  async getActivityDates(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Date[]> {
    return this.store
      .filter(
        (l) => l.userId === userId && l.createdAt >= from && l.createdAt <= to,
      )
      .map((l) => l.createdAt);
  }

  async getXpSumByUser(
    userIds: string[],
    since: Date,
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    for (const log of this.store) {
      if (userIds.includes(log.userId) && log.createdAt >= since) {
        map.set(log.userId, (map.get(log.userId) ?? 0) + log.xpGained);
      }
    }
    return map;
  }
}
