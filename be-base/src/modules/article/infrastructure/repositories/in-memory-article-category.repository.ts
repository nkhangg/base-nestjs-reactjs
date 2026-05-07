import type { IArticleCategoryRepository } from '../../domain/repositories/article-category.repository';
import type { ArticleCategory } from '../../domain/entities/article-category.entity';

export class InMemoryArticleCategoryRepository implements IArticleCategoryRepository {
  private readonly store = new Map<string, ArticleCategory>();

  async findById(id: string): Promise<ArticleCategory | null> {
    return this.store.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<ArticleCategory | null> {
    return Array.from(this.store.values()).find((c) => c.slug === slug) ?? null;
  }

  async list(): Promise<ArticleCategory[]> {
    return Array.from(this.store.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async save(category: ArticleCategory): Promise<void> {
    this.store.set(category.id.value, category);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
