import type { BlogPost, BlogPostStatus } from '../entities/blog-post.entity';

export const BLOG_POST_REPOSITORY = Symbol('BLOG_POST_REPOSITORY');

export interface FindAllPostsOptions {
  page: number;
  pageSize: number;
  status?: BlogPostStatus;
  categoryId?: string;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'publishedAt';
  sortDir?: 'asc' | 'desc';
  publishedOnly?: boolean;
}

export interface IBlogPostRepository {
  findById(id: string): Promise<BlogPost | null>;
  findBySlug(slug: string): Promise<BlogPost | null>;
  findAll(opts: FindAllPostsOptions): Promise<{ data: BlogPost[]; total: number }>;
  save(post: BlogPost): Promise<void>;
  delete(id: string): Promise<void>;
}
