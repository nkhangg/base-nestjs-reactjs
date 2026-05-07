import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  IQuestionRepository,
  ListQuestionsOptions,
} from '../../domain/repositories/question.repository';
import type { Question } from '../../domain/entities/question.entity';
import { QuestionMapper } from '../mappers/question.mapper';

@Injectable()
export class PrismaQuestionRepository implements IQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Question | null> {
    const r = await this.prisma.question.findUnique({ where: { id } });
    return r ? QuestionMapper.toDomain(r) : null;
  }

  async list(
    opts: ListQuestionsOptions,
  ): Promise<{ data: Question[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (opts.status) where['status'] = opts.status;
    if (opts.referenceType) where['referenceType'] = opts.referenceType;
    if (opts.referenceId) where['referenceId'] = opts.referenceId;
    if (opts.isPublic !== undefined) where['isPublic'] = opts.isPublic;

    const skip = (opts.page - 1) * opts.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: opts.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return { data: rows.map(QuestionMapper.toDomain), total };
  }

  async listByReference(
    referenceType: string,
    referenceId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Question[]; total: number }> {
    const where = {
      referenceType,
      referenceId,
      status: 'approved',
      isPublic: true,
    };

    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return { data: rows.map(QuestionMapper.toDomain), total };
  }

  async findApprovedPublic(
    count: number,
    jlptLevel?: number,
  ): Promise<Question[]> {
    const where: Record<string, unknown> = {
      status: 'approved',
      isPublic: true,
    };

    if (jlptLevel !== undefined) {
      where['questionData'] = {
        path: ['jlptLevel'],
        equals: jlptLevel,
      };
    }

    // Fetch a larger pool then shuffle for randomness
    const pool = await this.prisma.question.findMany({
      where,
      take: count * 5,
      orderBy: { createdAt: 'asc' },
    });

    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(QuestionMapper.toDomain);
  }

  async save(question: Question): Promise<void> {
    const data = {
      questionData: question.questionData as object,
      referenceType: question.referenceType,
      referenceId: question.referenceId,
      status: question.status,
      isPublic: question.isPublic,
      creatorId: question.creatorId,
      staffAuthorId: question.staffAuthorId,
      verifiedBy: question.verifiedBy,
      createdAt: question.createdAt,
    };

    await this.prisma.question.upsert({
      where: { id: question.id.value },
      create: { id: question.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.question.delete({ where: { id } });
  }
}
