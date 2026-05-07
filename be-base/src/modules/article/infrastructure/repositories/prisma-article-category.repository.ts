import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { IArticleCategoryRepository } from '../../domain/repositories/article-category.repository';
import type { ArticleCategory } from '../../domain/entities/article-category.entity';
import { ArticleCategoryMapper } from '../mappers/article-category.mapper';

@Injectable()
export class PrismaArticleCategoryRepository implements IArticleCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ArticleCategory | null> {
    const r = await this.prisma.articleCategory.findUnique({ where: { id } });
    return r ? ArticleCategoryMapper.toDomain(r) : null;
  }

  async findBySlug(slug: string): Promise<ArticleCategory | null> {
    const r = await this.prisma.articleCategory.findUnique({ where: { slug } });
    return r ? ArticleCategoryMapper.toDomain(r) : null;
  }

  async list(): Promise<ArticleCategory[]> {
    const rows = await this.prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(ArticleCategoryMapper.toDomain);
  }

  async save(category: ArticleCategory): Promise<void> {
    const data = {
      name: category.name,
      slug: category.slug,
      colorCode: category.colorCode,
      iconUrl: category.iconUrl,
    };
    await this.prisma.articleCategory.upsert({
      where: { id: category.id.value },
      create: { id: category.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.articleCategory.delete({ where: { id } });
  }
}
