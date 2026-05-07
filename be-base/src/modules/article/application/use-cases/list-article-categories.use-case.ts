import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLE_CATEGORY_REPOSITORY,
  type IArticleCategoryRepository,
} from '../../domain/repositories/article-category.repository';
import type { ArticleCategory } from '../../domain/entities/article-category.entity';

@Injectable()
export class ListArticleCategoriesUseCase {
  constructor(
    @Inject(ARTICLE_CATEGORY_REPOSITORY)
    private readonly repo: IArticleCategoryRepository,
  ) {}

  async execute(): Promise<ArticleCategory[]> {
    return this.repo.list();
  }
}
