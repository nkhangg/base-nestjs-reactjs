import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  BLOG_CATEGORY_REPOSITORY,
  type IBlogCategoryRepository,
} from '../../domain/repositories/blog-category.repository';

export interface UpdateBlogCategoryInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  coverFileId?: string | null;
}

export type UpdateBlogCategoryResult = Result<void, string>;

@Injectable()
export class UpdateBlogCategoryUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBlogCategoryRepository,
  ) {}

  async execute(input: UpdateBlogCategoryInput): Promise<UpdateBlogCategoryResult> {
    const category = await this.categoryRepo.findById(input.id);
    if (!category) return { ok: false, error: 'NOT_FOUND' };

    if (input.name && input.name !== category.name) {
      const existing = await this.categoryRepo.findByName(input.name);
      if (existing) return { ok: false, error: 'NAME_EXISTS' };
    }

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.categoryRepo.findBySlug(input.slug);
      if (existing) return { ok: false, error: 'SLUG_EXISTS' };
    }

    category.update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      coverFileId: input.coverFileId,
    });

    await this.categoryRepo.save(category);
    return { ok: true, value: undefined };
  }
}
