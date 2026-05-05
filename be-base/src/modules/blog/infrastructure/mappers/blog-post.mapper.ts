import {
  BlogPost,
  type BlogPostStatus,
} from '../../domain/entities/blog-post.entity';

interface BlogPostRecord {
  id: string;
  slug: string;
  title: string;
  content: string;
  contentType?: string;
  excerpt: string | null;
  status: string;
  coverFileId: string | null;
  categoryId: string | null;
  tags: string[];
  authorId: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogPostMapper {
  static toDomain(r: BlogPostRecord): BlogPost {
    return BlogPost.reconstitute(r.id, {
      slug: r.slug,
      title: r.title,
      content: r.content,
      contentType: r.contentType ?? 'markdown',
      excerpt: r.excerpt,
      status: r.status as BlogPostStatus,
      coverFileId: r.coverFileId,
      categoryId: r.categoryId,
      tags: r.tags,
      authorId: r.authorId,
      metaTitle: r.metaTitle,
      metaDesc: r.metaDesc,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }
}
