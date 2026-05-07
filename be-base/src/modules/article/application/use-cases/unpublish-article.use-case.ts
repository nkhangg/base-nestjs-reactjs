import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';

export type UnpublishArticleResult = Result<void, string>;

@Injectable()
export class UnpublishArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(id: string): Promise<UnpublishArticleResult> {
    const article = await this.repo.findById(id);
    if (!article) return { ok: false, error: 'NOT_FOUND' };

    if (article.status !== 'published') {
      return { ok: false, error: 'ARTICLE_NOT_PUBLISHED' };
    }

    article.unpublish();
    await this.repo.save(article);
    return { ok: true, value: undefined };
  }
}
