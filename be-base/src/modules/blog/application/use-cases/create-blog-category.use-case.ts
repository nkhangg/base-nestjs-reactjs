import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { BlogCategory } from '../../domain/entities/blog-category.entity';
import {
  BLOG_CATEGORY_REPOSITORY,
  type IBlogCategoryRepository,
} from '../../domain/repositories/blog-category.repository';
import { generateSlug } from '../../infrastructure/utils/slug.util';

export interface CreateBlogCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  coverFileId?: string;
}

export type CreateBlogCategoryResult = Result<{ categoryId: string }, string>;

@Injectable()
export class CreateBlogCategoryUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBlogCategoryRepository,
  ) {}

  async execute(input: CreateBlogCategoryInput): Promise<CreateBlogCategoryResult> {
    const existing = await this.categoryRepo.findByName(input.name);
    if (existing) return { ok: false, error: 'NAME_EXISTS' };

    const slug = input.slug || generateSlug(input.name);
    const existingSlug = await this.categoryRepo.findBySlug(slug);
    if (existingSlug) return { ok: false, error: 'SLUG_EXISTS' };

    const category = BlogCategory.create({
      name: input.name,
      slug,
      description: input.description,
      coverFileId: input.coverFileId,
    });

    await this.categoryRepo.save(category);
    return { ok: true, value: { categoryId: category.id.value } };
  }
}
