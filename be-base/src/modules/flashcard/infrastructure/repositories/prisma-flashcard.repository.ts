import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  Flashcard,
  FlashcardStatus,
} from '../../domain/entities/flashcard.entity';
import type { IFlashcardRepository } from '../../domain/repositories/flashcard.repository';
import { FlashcardMapper } from '../mappers/flashcard.mapper';

@Injectable()
export class PrismaFlashcardRepository implements IFlashcardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Flashcard | null> {
    const r = await this.prisma.flashcard.findUnique({ where: { id } });
    return r ? FlashcardMapper.toDomain(r) : null;
  }

  async findByUserAndEntry(
    userId: string,
    dictionaryEntryId: string,
  ): Promise<Flashcard | null> {
    const r = await this.prisma.flashcard.findUnique({
      where: { userId_dictionaryEntryId: { userId, dictionaryEntryId } },
    });
    return r ? FlashcardMapper.toDomain(r) : null;
  }

  async findDueCards(userId: string, limit: number): Promise<Flashcard[]> {
    const rows = await this.prisma.flashcard.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        status: { not: 'mastered' },
      },
      orderBy: { nextReview: 'asc' },
      take: limit,
    });
    return rows.map(FlashcardMapper.toDomain);
  }

  async listByUser(
    userId: string,
    status: FlashcardStatus | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ data: Flashcard[]; total: number }> {
    const where: Record<string, unknown> = { userId };
    if (status !== undefined) where['status'] = status;

    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.flashcard.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.flashcard.count({ where }),
    ]);

    return { data: rows.map(FlashcardMapper.toDomain), total };
  }

  async save(flashcard: Flashcard): Promise<void> {
    const data = {
      userId: flashcard.userId,
      dictionaryEntryId: flashcard.dictionaryEntryId,
      interval: flashcard.interval,
      easeFactor: flashcard.easeFactor,
      nextReview: flashcard.nextReview,
      status: flashcard.status,
      lastReviewedAt: flashcard.lastReviewedAt,
      createdAt: flashcard.createdAt,
    };

    await this.prisma.flashcard.upsert({
      where: { id: flashcard.id.value },
      create: { id: flashcard.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.flashcard.delete({ where: { id } });
  }
}
