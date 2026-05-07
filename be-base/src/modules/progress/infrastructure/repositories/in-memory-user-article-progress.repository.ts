import type { UserArticleProgress } from '../../domain/entities/user-article-progress.entity';
import type { IUserArticleProgressRepository } from '../../domain/repositories/user-article-progress.repository';

export class InMemoryUserArticleProgressRepository implements IUserArticleProgressRepository {
  private readonly store = new Map<string, UserArticleProgress>();

  private key(userId: string, articleId: string): string {
    return `${userId}:${articleId}`;
  }

  async upsert(progress: UserArticleProgress): Promise<void> {
    this.store.set(this.key(progress.userId, progress.articleId), progress);
  }

  async findByUserAndArticle(
    userId: string,
    articleId: string,
  ): Promise<UserArticleProgress | null> {
    return this.store.get(this.key(userId, articleId)) ?? null;
  }

  async listByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: UserArticleProgress[]; total: number }> {
    const results = Array.from(this.store.values()).filter(
      (p) => p.userId === userId,
    );
    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }
}
