import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { IArticleTagRepository } from '../../domain/repositories/article-tag.repository';
import type { ArticleTag } from '../../domain/entities/article-tag.entity';
import { ArticleTagMapper } from '../mappers/article-tag.mapper';

@Injectable()
export class PrismaArticleTagRepository implements IArticleTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ArticleTag | null> {
    const r = await this.prisma.articleTag.findUnique({ where: { id } });
    return r ? ArticleTagMapper.toDomain(r) : null;
  }

  async findByName(name: string): Promise<ArticleTag | null> {
    const r = await this.prisma.articleTag.findUnique({ where: { name } });
    return r ? ArticleTagMapper.toDomain(r) : null;
  }

  async list(): Promise<ArticleTag[]> {
    const rows = await this.prisma.articleTag.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(ArticleTagMapper.toDomain);
  }

  async save(tag: ArticleTag): Promise<void> {
    await this.prisma.articleTag.upsert({
      where: { id: tag.id.value },
      create: { id: tag.id.value, name: tag.name },
      update: { name: tag.name },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.articleTag.delete({ where: { id } });
  }
}
