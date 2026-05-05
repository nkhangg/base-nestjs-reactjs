import { Inject, Injectable } from '@nestjs/common';
import type { BlogCategory } from '../../domain/entities/blog-category.entity';
import {
  BLOG_CATEGORY_REPOSITORY,
  type IBlogCategoryRepository,
  type FindAllCategoriesOptions,
} from '../../domain/repositories/blog-category.repository';

export type ListBlogCategoriesResult = { data: BlogCategory[]; total: number };

@Injectable()
export class ListBlogCategoriesUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBlogCategoryRepository,
  ) {}

  async execute(opts: FindAllCategoriesOptions): Promise<ListBlogCategoriesResult> {
    return this.categoryRepo.findAll(opts);
  }
}
