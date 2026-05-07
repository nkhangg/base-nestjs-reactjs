import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  DictionaryEntry,
  DictionaryEntryStatus,
} from '../../domain/entities/dictionary-entry.entity';
import type {
  IDictionaryRepository,
  SearchDictionaryOptions,
} from '../../domain/repositories/dictionary.repository';
import { DictionaryMapper } from '../mappers/dictionary.mapper';

@Injectable()
export class PrismaDictionaryRepository implements IDictionaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DictionaryEntry | null> {
    const r = await this.prisma.dictionaryEntry.findUnique({ where: { id } });
    return r ? DictionaryMapper.toDomain(r) : null;
  }

  async search(
    opts: SearchDictionaryOptions,
  ): Promise<{ data: DictionaryEntry[]; total: number }> {
    const where: Record<string, unknown> = {
      status: 'approved',
      isPublic: true,
    };

    if (opts.query) {
      where['OR'] = [
        { kanji: { contains: opts.query, mode: 'insensitive' } },
        { hiragana: { contains: opts.query, mode: 'insensitive' } },
        { romaji: { contains: opts.query, mode: 'insensitive' } },
      ];
    }

    if (opts.jlptLevel !== undefined) {
      where['jlptLevel'] = opts.jlptLevel;
    }

    const skip = (opts.page - 1) * opts.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.dictionaryEntry.findMany({
        where,
        skip,
        take: opts.pageSize,
        orderBy: { hiragana: 'asc' },
      }),
      this.prisma.dictionaryEntry.count({ where }),
    ]);

    return { data: rows.map(DictionaryMapper.toDomain), total };
  }

  async findByStatus(
    status: DictionaryEntryStatus,
    page: number,
    pageSize: number,
  ): Promise<{ data: DictionaryEntry[]; total: number }> {
    const where = { status };
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.dictionaryEntry.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dictionaryEntry.count({ where }),
    ]);

    return { data: rows.map(DictionaryMapper.toDomain), total };
  }

  async save(entry: DictionaryEntry): Promise<void> {
    const data = {
      kanji: entry.kanji,
      hiragana: entry.hiragana,
      romaji: entry.romaji,
      meanings: entry.meanings,
      jlptLevel: entry.jlptLevel,
      status: entry.status,
      isPublic: entry.isPublic,
      creatorId: entry.creatorId,
      staffAuthorId: entry.staffAuthorId,
      verifiedBy: entry.verifiedBy,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };

    await this.prisma.dictionaryEntry.upsert({
      where: { id: entry.id.value },
      create: { id: entry.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.dictionaryEntry.delete({ where: { id } });
  }
}
