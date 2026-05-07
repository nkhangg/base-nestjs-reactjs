import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';
import type { Article } from '../../domain/entities/article.entity';

@Injectable()
export class ListPendingArticlesUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(
    page: number,
    pageSize: number,
  ): Promise<{ data: Article[]; total: number }> {
    return this.repo.findByStatus('pending', page, pageSize);
  }
}
