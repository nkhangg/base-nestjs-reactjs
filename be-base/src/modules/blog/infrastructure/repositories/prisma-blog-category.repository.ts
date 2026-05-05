import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { BlogCategory } from '../../domain/entities/blog-category.entity';
import type {
  IBlogCategoryRepository,
  FindAllCategoriesOptions,
} from '../../domain/repositories/blog-category.repository';
import { BlogCategoryMapper } from '../mappers/blog-category.mapper';

@Injectable()
export class PrismaBlogCategoryRepository implements IBlogCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BlogCategory | null> {
    const r = await this.prisma.blogCategory.findUnique({ where: { id } });
    return r ? BlogCategoryMapper.toDomain(r) : null;
  }

  async findBySlug(slug: string): Promise<BlogCategory | null> {
    const r = await this.prisma.blogCategory.findUnique({ where: { slug } });
    return r ? BlogCategoryMapper.toDomain(r) : null;
  }

  async findByName(name: string): Promise<BlogCategory | null> {
    const r = await this.prisma.blogCategory.findUnique({ where: { name } });
    return r ? BlogCategoryMapper.toDomain(r) : null;
  }

  async findAll(opts: FindAllCategoriesOptions): Promise<{ data: BlogCategory[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (opts.search) {
      where['OR'] = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { description: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const sortKey = opts.sortBy ?? 'name';
    const sortDir = opts.sortDir ?? 'asc';
    const skip = (opts.page - 1) * opts.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.blogCategory.findMany({
        where,
        skip,
        take: opts.pageSize,
        orderBy: { [sortKey]: sortDir },
      }),
      this.prisma.blogCategory.count({ where }),
    ]);

    return { data: rows.map(BlogCategoryMapper.toDomain), total };
  }

  async save(category: BlogCategory): Promise<void> {
    const data = {
      name: category.name,
      slug: category.slug,
      description: category.description,
      coverFileId: category.coverFileId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    await this.prisma.blogCategory.upsert({
      where: { id: category.id.value },
      create: { id: category.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.blogCategory.delete({ where: { id } });
  }
}
