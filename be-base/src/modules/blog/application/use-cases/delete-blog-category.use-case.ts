import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  BLOG_CATEGORY_REPOSITORY,
  type IBlogCategoryRepository,
} from '../../domain/repositories/blog-category.repository';

export type DeleteBlogCategoryResult = Result<void, string>;

@Injectable()
export class DeleteBlogCategoryUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBlogCategoryRepository,
  ) {}

  async execute(id: string): Promise<DeleteBlogCategoryResult> {
    const category = await this.categoryRepo.findById(id);
    if (!category) return { ok: false, error: 'NOT_FOUND' };

    await this.categoryRepo.delete(id);
    return { ok: true, value: undefined };
  }
}
