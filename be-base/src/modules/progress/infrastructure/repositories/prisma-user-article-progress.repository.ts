import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { UserArticleProgress } from '../../domain/entities/user-article-progress.entity';
import type { IUserArticleProgressRepository } from '../../domain/repositories/user-article-progress.repository';
import { UserArticleProgressMapper } from '../mappers/user-article-progress.mapper';

@Injectable()
export class PrismaUserArticleProgressRepository implements IUserArticleProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(progress: UserArticleProgress): Promise<void> {
    const data = {
      status: progress.status,
      lastScrollPosition: progress.lastScrollPosition,
      completedAt: progress.completedAt,
    };
    await this.prisma.userArticleProgress.upsert({
      where: {
        userId_articleId: {
          userId: progress.userId,
          articleId: progress.articleId,
        },
      },
      create: {
        userId: progress.userId,
        articleId: progress.articleId,
        ...data,
      },
      update: data,
    });
  }

  async findByUserAndArticle(
    userId: string,
    articleId: string,
  ): Promise<UserArticleProgress | null> {
    const r = await this.prisma.userArticleProgress.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });
    return r ? UserArticleProgressMapper.toDomain(r) : null;
  }

  async listByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: UserArticleProgress[]; total: number }> {
    const where = { userId };
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.userArticleProgress.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.userArticleProgress.count({ where }),
    ]);
    return { data: rows.map(UserArticleProgressMapper.toDomain), total };
  }
}
