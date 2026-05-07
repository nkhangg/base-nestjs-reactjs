import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';
import type { Article } from '../../domain/entities/article.entity';

export type GetArticleResult = Result<Article, string>;

@Injectable()
export class GetArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(id: string): Promise<GetArticleResult> {
    const article = await this.repo.findById(id);
    if (!article) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: article };
  }
}
