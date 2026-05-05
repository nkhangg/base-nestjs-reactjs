import { BlogCategory } from '../../domain/entities/blog-category.entity';

interface BlogCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogCategoryMapper {
  static toDomain(r: BlogCategoryRecord): BlogCategory {
    return BlogCategory.reconstitute(r.id, {
      name: r.name,
      slug: r.slug,
      description: r.description,
      coverFileId: r.coverFileId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }
}
