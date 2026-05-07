import type { IArticleTagRepository } from '../../domain/repositories/article-tag.repository';
import type { ArticleTag } from '../../domain/entities/article-tag.entity';

export class InMemoryArticleTagRepository implements IArticleTagRepository {
  private readonly store = new Map<string, ArticleTag>();

  async findById(id: string): Promise<ArticleTag | null> {
    return this.store.get(id) ?? null;
  }

  async findByName(name: string): Promise<ArticleTag | null> {
    return Array.from(this.store.values()).find((t) => t.name === name) ?? null;
  }

  async list(): Promise<ArticleTag[]> {
    return Array.from(this.store.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async save(tag: ArticleTag): Promise<void> {
    this.store.set(tag.id.value, tag);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
