import { Article } from '../../domain/entities/article.entity';
import type { ArticleStatus } from '../../domain/entities/article.entity';

interface PrismaArticleRow {
  id: string;
  title: string;
  slug: string;
  contentRaw: string;
  contentAnnotated: unknown;
  level: number | null;
  status: string;
  authorId: string | null;
  staffAuthorId: string | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  categories?: Array<{ categoryId: string }>;
  tags?: Array<{ tagId: string }>;
}

export class ArticleMapper {
  static toDomain(row: PrismaArticleRow): Article {
    return Article.reconstitute(row.id, {
      title: row.title,
      slug: row.slug,
      contentRaw: row.contentRaw,
      contentAnnotated:
        row.contentAnnotated != null
          ? (row.contentAnnotated as Record<string, unknown>)
          : null,
      level: row.level,
      status: row.status as ArticleStatus,
      authorId: row.authorId,
      staffAuthorId: row.staffAuthorId,
      verifiedBy: row.verifiedBy,
      categoryIds: row.categories?.map((c) => c.categoryId) ?? [],
      tagIds: row.tags?.map((t) => t.tagId) ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
