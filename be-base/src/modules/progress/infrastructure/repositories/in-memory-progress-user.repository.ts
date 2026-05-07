import type {
  IProgressUserRepository,
  UserStats,
  LeaderboardEntry,
} from '../../domain/repositories/progress-user.repository';

interface UserStub {
  userId: string;
  email: string;
  name: string | null;
  xpTotal: number;
  streakCount: number;
  isActive: boolean;
  dueFlashcardsCount: number;
}

export class InMemoryProgressUserRepository implements IProgressUserRepository {
  private readonly users = new Map<string, UserStub>();

  seed(stub: UserStub): void {
    this.users.set(stub.userId, stub);
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    const u = this.users.get(userId);
    if (!u) return null;
    return {
      userId: u.userId,
      email: u.email,
      name: u.name,
      xpTotal: u.xpTotal,
      streakCount: u.streakCount,
    };
  }

  async incrementXp(userId: string, amount: number): Promise<void> {
    const u = this.users.get(userId);
    if (u) u.xpTotal += amount;
  }

  async updateStreak(userId: string, count: number): Promise<void> {
    const u = this.users.get(userId);
    if (u) u.streakCount = count;
  }

  async getDueFlashcardsCount(userId: string): Promise<number> {
    return this.users.get(userId)?.dueFlashcardsCount ?? 0;
  }

  async getTopByXpAllTime(limit: number): Promise<LeaderboardEntry[]> {
    return Array.from(this.users.values())
      .filter((u) => u.isActive)
      .sort((a, b) => b.xpTotal - a.xpTotal)
      .slice(0, limit)
      .map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
        xpTotal: u.xpTotal,
      }));
  }

  async getTopByXpWeekly(
    limit: number,
    _since: Date,
  ): Promise<LeaderboardEntry[]> {
    return this.getTopByXpAllTime(limit);
  }
}
