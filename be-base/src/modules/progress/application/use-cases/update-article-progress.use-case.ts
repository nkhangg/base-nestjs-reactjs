import { Inject, Injectable } from '@nestjs/common';
import { UserArticleProgress } from '../../domain/entities/user-article-progress.entity';
import {
  USER_ARTICLE_PROGRESS_REPOSITORY,
  type IUserArticleProgressRepository,
} from '../../domain/repositories/user-article-progress.repository';

export interface UpdateArticleProgressInput {
  userId: string;
  articleId: string;
  lastScrollPosition?: number;
  markCompleted?: boolean;
}

@Injectable()
export class UpdateArticleProgressUseCase {
  constructor(
    @Inject(USER_ARTICLE_PROGRESS_REPOSITORY)
    private readonly repo: IUserArticleProgressRepository,
  ) {}

  async execute(
    input: UpdateArticleProgressInput,
  ): Promise<UserArticleProgress> {
    let progress = await this.repo.findByUserAndArticle(
      input.userId,
      input.articleId,
    );

    if (!progress) {
      progress = UserArticleProgress.create({
        userId: input.userId,
        articleId: input.articleId,
      });
    }

    if (input.lastScrollPosition !== undefined) {
      progress.updatePosition(input.lastScrollPosition);
    }

    if (input.markCompleted) {
      progress.markCompleted();
    }

    await this.repo.upsert(progress);
    return progress;
  }
}
