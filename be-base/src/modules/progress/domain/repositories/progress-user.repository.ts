export const PROGRESS_USER_REPOSITORY = Symbol('PROGRESS_USER_REPOSITORY');

export interface UserStats {
  userId: string;
  email: string;
  name: string | null;
  xpTotal: number;
  streakCount: number;
}

export interface LeaderboardEntry {
  userId: string;
  email: string;
  name: string | null;
  xpTotal: number;
  weeklyXp?: number;
}

export interface IProgressUserRepository {
  getUserStats(userId: string): Promise<UserStats | null>;
  incrementXp(userId: string, amount: number): Promise<void>;
  updateStreak(userId: string, count: number): Promise<void>;
  getDueFlashcardsCount(userId: string): Promise<number>;
  getTopByXpAllTime(limit: number): Promise<LeaderboardEntry[]>;
  getTopByXpWeekly(limit: number, since: Date): Promise<LeaderboardEntry[]>;
}
