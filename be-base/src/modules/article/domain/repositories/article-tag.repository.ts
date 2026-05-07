import type { ArticleTag } from '../entities/article-tag.entity';

export const ARTICLE_TAG_REPOSITORY = Symbol('ARTICLE_TAG_REPOSITORY');

export interface IArticleTagRepository {
  findById(id: string): Promise<ArticleTag | null>;
  findByName(name: string): Promise<ArticleTag | null>;
  list(): Promise<ArticleTag[]>;
  save(tag: ArticleTag): Promise<void>;
  delete(id: string): Promise<void>;
}
