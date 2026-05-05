import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { BlogPost } from '../../domain/entities/blog-post.entity';
import type {
  IBlogPostRepository,
  FindAllPostsOptions,
} from '../../domain/repositories/blog-post.repository';
import { BlogPostMapper } from '../mappers/blog-post.mapper';

@Injectable()
export class PrismaBlogPostRepository implements IBlogPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BlogPost | null> {
    const r = await this.prisma.blogPost.findUnique({ where: { id } });
    return r ? BlogPostMapper.toDomain(r) : null;
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    const r = await this.prisma.blogPost.findUnique({ where: { slug } });
    return r ? BlogPostMapper.toDomain(r) : null;
  }

  async findAll(opts: FindAllPostsOptions): Promise<{ data: BlogPost[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (opts.publishedOnly) {
      where['status'] = 'published';
    } else if (opts.status) {
      where['status'] = opts.status;
    }

    if (opts.categoryId) where['categoryId'] = opts.categoryId;

    if (opts.search) {
      where['OR'] = [
        { title: { contains: opts.search, mode: 'insensitive' } },
        { content: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const sortKey = opts.sortBy ?? 'createdAt';
    const sortDir = opts.sortDir ?? 'desc';
    const skip = (opts.page - 1) * opts.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: opts.pageSize,
        orderBy: { [sortKey]: sortDir },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { data: rows.map(BlogPostMapper.toDomain), total };
  }

  async save(post: BlogPost): Promise<void> {
    const data = {
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      coverFileId: post.coverFileId,
      categoryId: post.categoryId,
      tags: post.tags,
      authorId: post.authorId,
      metaTitle: post.metaTitle,
      metaDesc: post.metaDesc,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    await this.prisma.blogPost.upsert({
      where: { id: post.id.value },
      create: { id: post.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.blogPost.delete({ where: { id } });
  }
}
