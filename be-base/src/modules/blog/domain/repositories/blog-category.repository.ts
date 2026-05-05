import type { BlogCategory } from '../entities/blog-category.entity';

export const BLOG_CATEGORY_REPOSITORY = Symbol('BLOG_CATEGORY_REPOSITORY');

export interface FindAllCategoriesOptions {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface IBlogCategoryRepository {
  findById(id: string): Promise<BlogCategory | null>;
  findBySlug(slug: string): Promise<BlogCategory | null>;
  findByName(name: string): Promise<BlogCategory | null>;
  findAll(
    opts: FindAllCategoriesOptions,
  ): Promise<{ data: BlogCategory[]; total: number }>;
  save(category: BlogCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
