import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_CATEGORY_REPOSITORY,
  type IArticleCategoryRepository,
} from '../../domain/repositories/article-category.repository';

export type DeleteArticleCategoryResult = Result<void, string>;

@Injectable()
export class DeleteArticleCategoryUseCase {
  constructor(
    @Inject(ARTICLE_CATEGORY_REPOSITORY)
    private readonly repo: IArticleCategoryRepository,
  ) {}

  async execute(id: string): Promise<DeleteArticleCategoryResult> {
    const category = await this.repo.findById(id);
    if (!category) return { ok: false, error: 'NOT_FOUND' };

    await this.repo.delete(id);
    return { ok: true, value: undefined };
  }
}
