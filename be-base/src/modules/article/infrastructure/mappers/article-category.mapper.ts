import { ArticleCategory } from '../../domain/entities/article-category.entity';

interface PrismaArticleCategory {
  id: string;
  name: string;
  slug: string;
  colorCode: string | null;
  iconUrl: string | null;
}

export class ArticleCategoryMapper {
  static toDomain(row: PrismaArticleCategory): ArticleCategory {
    return ArticleCategory.reconstitute(row.id, {
      name: row.name,
      slug: row.slug,
      colorCode: row.colorCode,
      iconUrl: row.iconUrl,
    });
  }
}
