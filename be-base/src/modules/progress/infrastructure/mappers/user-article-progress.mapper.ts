import {
  UserArticleProgress,
  type ArticleProgressStatus,
} from '../../domain/entities/user-article-progress.entity';

interface UserArticleProgressRecord {
  userId: string;
  articleId: string;
  status: string;
  lastScrollPosition: number;
  completedAt: Date | null;
}

export class UserArticleProgressMapper {
  static toDomain(r: UserArticleProgressRecord): UserArticleProgress {
    return UserArticleProgress.reconstitute({
      userId: r.userId,
      articleId: r.articleId,
      status: r.status as ArticleProgressStatus,
      lastScrollPosition: r.lastScrollPosition,
      completedAt: r.completedAt,
    });
  }
}
