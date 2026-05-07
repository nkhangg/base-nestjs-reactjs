import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  IArticleRepository,
  ListArticlesOptions,
} from '../../domain/repositories/article.repository';
import type {
  Article,
  ArticleStatus,
} from '../../domain/entities/article.entity';
import { ArticleMapper } from '../mappers/article.mapper';

const WITH_RELATIONS = {
  categories: { select: { categoryId: true } },
  tags: { select: { tagId: true } },
};

@Injectable()
export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Article | null> {
    const r = await this.prisma.article.findUnique({
      where: { id },
      include: WITH_RELATIONS,
    });
    return r ? ArticleMapper.toDomain(r) : null;
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const r = await this.prisma.article.findUnique({
      where: { slug },
      include: WITH_RELATIONS,
    });
    return r ? ArticleMapper.toDomain(r) : null;
  }

  async list(
    opts: ListArticlesOptions,
  ): Promise<{ data: Article[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (opts.status) where['status'] = opts.status;
    if (opts.level !== undefined) where['level'] = opts.level;

    if (opts.categoryId) {
      where['categories'] = {
        some: { categoryId: opts.categoryId },
      };
    }

    if (opts.tagId) {
      where['tags'] = { some: { tagId: opts.tagId } };
    }

    if (opts.search) {
      where['OR'] = [{ title: { contains: opts.search, mode: 'insensitive' } }];
    }

    const skip = (opts.page - 1) * opts.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: WITH_RELATIONS,
        skip,
        take: opts.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { data: rows.map(ArticleMapper.toDomain), total };
  }

  async findByStatus(
    status: ArticleStatus,
    page: number,
    pageSize: number,
  ): Promise<{ data: Article[]; total: number }> {
    const where = { status };
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: WITH_RELATIONS,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { data: rows.map(ArticleMapper.toDomain), total };
  }

  async save(article: Article): Promise<void> {
    const data = {
      title: article.title,
      slug: article.slug,
      contentRaw: article.contentRaw,
      contentAnnotated:
        article.contentAnnotated != null
          ? (article.contentAnnotated as Prisma.InputJsonValue)
          : undefined,
      level: article.level,
      status: article.status,
      authorId: article.authorId,
      staffAuthorId: article.staffAuthorId,
      verifiedBy: article.verifiedBy,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.article.upsert({
        where: { id: article.id.value },
        create: { id: article.id.value, ...data },
        update: data,
      });

      await tx.articleCategoryMap.deleteMany({
        where: { articleId: article.id.value },
      });
      if (article.categoryIds.length > 0) {
        await tx.articleCategoryMap.createMany({
          data: article.categoryIds.map((categoryId) => ({
            articleId: article.id.value,
            categoryId,
          })),
        });
      }

      await tx.articleTagMap.deleteMany({
        where: { articleId: article.id.value },
      });
      if (article.tagIds.length > 0) {
        await tx.articleTagMap.createMany({
          data: article.tagIds.map((tagId) => ({
            articleId: article.id.value,
            tagId,
          })),
        });
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.article.delete({ where: { id } });
  }
}
