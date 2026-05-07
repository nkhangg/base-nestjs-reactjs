import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
  type ListArticlesOptions,
} from '../../domain/repositories/article.repository';
import type { Article } from '../../domain/entities/article.entity';

@Injectable()
export class ListArticlesUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(
    opts: ListArticlesOptions,
  ): Promise<{ data: Article[]; total: number }> {
    return this.repo.list(opts);
  }
}
