import type {
  IArticleRepository,
  ListArticlesOptions,
} from '../../domain/repositories/article.repository';
import type {
  Article,
  ArticleStatus,
} from '../../domain/entities/article.entity';

export class InMemoryArticleRepository implements IArticleRepository {
  private readonly store = new Map<string, Article>();

  async findById(id: string): Promise<Article | null> {
    return this.store.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Article | null> {
    return Array.from(this.store.values()).find((a) => a.slug === slug) ?? null;
  }

  async list(
    opts: ListArticlesOptions,
  ): Promise<{ data: Article[]; total: number }> {
    let results = Array.from(this.store.values());

    if (opts.status) results = results.filter((a) => a.status === opts.status);
    if (opts.level !== undefined)
      results = results.filter((a) => a.level === opts.level);
    if (opts.categoryId)
      results = results.filter((a) => a.categoryIds.includes(opts.categoryId!));
    if (opts.tagId)
      results = results.filter((a) => a.tagIds.includes(opts.tagId!));
    if (opts.search) {
      const q = opts.search.toLowerCase();
      results = results.filter((a) => a.title.toLowerCase().includes(q));
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (opts.page - 1) * opts.pageSize;
    return { data: results.slice(skip, skip + opts.pageSize), total };
  }

  async findByStatus(
    status: ArticleStatus,
    page: number,
    pageSize: number,
  ): Promise<{ data: Article[]; total: number }> {
    const results = Array.from(this.store.values())
      .filter((a) => a.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async save(article: Article): Promise<void> {
    this.store.set(article.id.value, article);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
