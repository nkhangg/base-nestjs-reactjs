import type { Article, ArticleStatus } from '../entities/article.entity';

export const ARTICLE_REPOSITORY = Symbol('ARTICLE_REPOSITORY');

export interface ListArticlesOptions {
  page: number;
  pageSize: number;
  status?: ArticleStatus;
  categoryId?: string;
  tagId?: string;
  level?: number;
  search?: string;
}

export interface IArticleRepository {
  findById(id: string): Promise<Article | null>;
  findBySlug(slug: string): Promise<Article | null>;
  list(opts: ListArticlesOptions): Promise<{ data: Article[]; total: number }>;
  findByStatus(
    status: ArticleStatus,
    page: number,
    pageSize: number,
  ): Promise<{ data: Article[]; total: number }>;
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
