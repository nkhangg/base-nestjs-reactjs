import type { UserArticleProgress } from '../entities/user-article-progress.entity';

export const USER_ARTICLE_PROGRESS_REPOSITORY = Symbol(
  'USER_ARTICLE_PROGRESS_REPOSITORY',
);

export interface IUserArticleProgressRepository {
  upsert(progress: UserArticleProgress): Promise<void>;
  findByUserAndArticle(
    userId: string,
    articleId: string,
  ): Promise<UserArticleProgress | null>;
  listByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: UserArticleProgress[]; total: number }>;
}
