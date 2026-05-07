export class StreakService {
  calculateStreak(activityDates: Date[]): number {
    if (activityDates.length === 0) return 0;

    const uniqueDays = new Set(activityDates.map((d) => this.toDateStr(d)));

    const today = this.toDateStr(new Date());
    const yesterday = this.toDateStr(this.daysAgo(1));

    if (!uniqueDays.has(today) && !uniqueDays.has(yesterday)) return 0;

    let streak = 0;
    let cursor = uniqueDays.has(today) ? new Date() : this.daysAgo(1);

    while (uniqueDays.has(this.toDateStr(cursor))) {
      streak++;
      cursor = this.daysAgo(streak);
    }

    return streak;
  }

  private toDateStr(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }
}
