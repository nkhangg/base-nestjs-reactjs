import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';
import type { Article } from '../../domain/entities/article.entity';

export type GetArticleBySlugResult = Result<Article, string>;

@Injectable()
export class GetArticleBySlugUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(slug: string): Promise<GetArticleBySlugResult> {
    const article = await this.repo.findBySlug(slug);
    if (!article) return { ok: false, error: 'NOT_FOUND' };
    if (article.status !== 'published')
      return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: article };
  }
}
