import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_CATEGORY_REPOSITORY,
  type IArticleCategoryRepository,
} from '../../domain/repositories/article-category.repository';

export interface UpdateArticleCategoryInput {
  id: string;
  name?: string;
  slug?: string;
  colorCode?: string | null;
  iconUrl?: string | null;
}

export type UpdateArticleCategoryResult = Result<void, string>;

@Injectable()
export class UpdateArticleCategoryUseCase {
  constructor(
    @Inject(ARTICLE_CATEGORY_REPOSITORY)
    private readonly repo: IArticleCategoryRepository,
  ) {}

  async execute(
    input: UpdateArticleCategoryInput,
  ): Promise<UpdateArticleCategoryResult> {
    const category = await this.repo.findById(input.id);
    if (!category) return { ok: false, error: 'NOT_FOUND' };

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.repo.findBySlug(input.slug);
      if (existing) return { ok: false, error: 'SLUG_TAKEN' };
    }

    category.update(input);
    await this.repo.save(category);
    return { ok: true, value: undefined };
  }
}
