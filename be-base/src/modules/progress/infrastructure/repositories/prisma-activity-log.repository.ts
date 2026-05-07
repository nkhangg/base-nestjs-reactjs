import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { ActivityLog } from '../../domain/entities/activity-log.entity';
import type {
  IActivityLogRepository,
  ListActivityLogsOptions,
} from '../../domain/repositories/activity-log.repository';
import { ActivityLogMapper } from '../mappers/activity-log.mapper';

@Injectable()
export class PrismaActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(log: ActivityLog): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        id: log.id.value,
        userId: log.userId,
        actionType: log.actionType,
        xpGained: log.xpGained,
        referenceId: log.referenceId,
        createdAt: log.createdAt,
      },
    });
  }

  async listByUser(
    opts: ListActivityLogsOptions,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const where: Record<string, unknown> = { userId: opts.userId };
    if (opts.from || opts.to) {
      const range: Record<string, Date> = {};
      if (opts.from) range['gte'] = opts.from;
      if (opts.to) range['lte'] = opts.to;
      where['createdAt'] = range;
    }

    const skip = (opts.page - 1) * opts.pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: opts.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { data: rows.map(ActivityLogMapper.toDomain), total };
  }

  async getActivityDates(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<Date[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.createdAt);
  }

  async getXpSumByUser(
    userIds: string[],
    since: Date,
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.activityLog.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, createdAt: { gte: since } },
      _sum: { xpGained: true },
    });

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.userId, row._sum.xpGained ?? 0);
    }
    return map;
  }
}
