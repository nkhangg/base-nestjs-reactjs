import type { ArticleCategory } from '../entities/article-category.entity';

export const ARTICLE_CATEGORY_REPOSITORY = Symbol(
  'ARTICLE_CATEGORY_REPOSITORY',
);

export interface IArticleCategoryRepository {
  findById(id: string): Promise<ArticleCategory | null>;
  findBySlug(slug: string): Promise<ArticleCategory | null>;
  list(): Promise<ArticleCategory[]>;
  save(category: ArticleCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
