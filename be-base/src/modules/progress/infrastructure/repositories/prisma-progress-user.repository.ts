import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  IProgressUserRepository,
  UserStats,
  LeaderboardEntry,
} from '../../domain/repositories/progress-user.repository';

@Injectable()
export class PrismaProgressUserRepository implements IProgressUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string): Promise<UserStats | null> {
    const r = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, xpTotal: true, streakCount: true },
    });
    if (!r) return null;
    return {
      userId: r.id,
      email: r.email,
      name: null,
      xpTotal: r.xpTotal,
      streakCount: r.streakCount,
    };
  }

  async incrementXp(userId: string, amount: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { xpTotal: { increment: amount } },
    });
  }

  async updateStreak(userId: string, count: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakCount: count },
    });
  }

  async getDueFlashcardsCount(userId: string): Promise<number> {
    return this.prisma.flashcard.count({
      where: {
        userId,
        nextReview: { lte: new Date() },
        status: { not: 'mastered' },
      },
    });
  }

  async getTopByXpAllTime(limit: number): Promise<LeaderboardEntry[]> {
    const rows = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, xpTotal: true },
      orderBy: { xpTotal: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      userId: r.id,
      email: r.email,
      name: null,
      xpTotal: r.xpTotal,
    }));
  }

  async getTopByXpWeekly(
    limit: number,
    since: Date,
  ): Promise<LeaderboardEntry[]> {
    const groups = await this.prisma.activityLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _sum: { xpGained: true },
      orderBy: { _sum: { xpGained: 'desc' } },
      take: limit,
    });

    if (groups.length === 0) return [];

    const userIds = groups.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { id: true, email: true, xpTotal: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    return groups
      .filter((g) => userMap.has(g.userId))
      .map((g) => ({
        userId: g.userId,
        email: userMap.get(g.userId)!.email,
        name: null,
        xpTotal: userMap.get(g.userId)!.xpTotal,
        weeklyXp: g._sum.xpGained ?? 0,
      }));
  }
}
