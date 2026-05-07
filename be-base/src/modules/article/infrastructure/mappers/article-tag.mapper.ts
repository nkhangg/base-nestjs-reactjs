import { ArticleTag } from '../../domain/entities/article-tag.entity';

interface PrismaArticleTag {
  id: string;
  name: string;
}

export class ArticleTagMapper {
  static toDomain(row: PrismaArticleTag): ArticleTag {
    return ArticleTag.reconstitute(row.id, { name: row.name });
  }
}
