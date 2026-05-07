import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_CATEGORY_REPOSITORY,
  type IArticleCategoryRepository,
} from '../../domain/repositories/article-category.repository';
import { ArticleCategory } from '../../domain/entities/article-category.entity';

export interface CreateArticleCategoryInput {
  name: string;
  slug: string;
  colorCode?: string;
  iconUrl?: string;
}

export type CreateArticleCategoryResult = Result<
  { categoryId: string },
  string
>;

@Injectable()
export class CreateArticleCategoryUseCase {
  constructor(
    @Inject(ARTICLE_CATEGORY_REPOSITORY)
    private readonly repo: IArticleCategoryRepository,
  ) {}

  async execute(
    input: CreateArticleCategoryInput,
  ): Promise<CreateArticleCategoryResult> {
    const existing = await this.repo.findBySlug(input.slug);
    if (existing) return { ok: false, error: 'SLUG_TAKEN' };

    const category = ArticleCategory.create(input);
    await this.repo.save(category);
    return { ok: true, value: { categoryId: category.id.value } };
  }
}
