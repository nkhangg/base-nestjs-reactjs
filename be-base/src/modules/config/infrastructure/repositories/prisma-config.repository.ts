import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { AppConfig } from '../../domain/entities/app-config.entity';
import type {
  FindAllConfigsOptions,
  FindAllConfigsResult,
  IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigMapper } from '../mappers/config.mapper';

@Injectable()
export class PrismaConfigRepository implements IConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AppConfig | null> {
    const r = await this.prisma.appConfig.findUnique({ where: { id } });
    return r ? ConfigMapper.toDomain(r) : null;
  }

  async findByKey(key: string): Promise<AppConfig | null> {
    const r = await this.prisma.appConfig.findUnique({ where: { key } });
    return r ? ConfigMapper.toDomain(r) : null;
  }

  async findByKeys(keys: string[]): Promise<AppConfig[]> {
    const rows = await this.prisma.appConfig.findMany({
      where: { key: { in: keys } },
    });
    return rows.map((r) => ConfigMapper.toDomain(r));
  }

  async findAll(options: FindAllConfigsOptions = {}): Promise<FindAllConfigsResult> {
    const where: Record<string, unknown> = {};

    if (options.scope !== undefined) where['scope'] = options.scope;
    if (options.isEnabled !== undefined) where['isEnabled'] = options.isEnabled;
    if (options.tags && options.tags.length > 0) {
      where['tags'] = { hasSome: options.tags };
    }
    if (options.search) {
      where['key'] = { contains: options.search, mode: 'insensitive' };
    }

    const sortBy = options.sortBy ?? 'createdAt';
    const sortDir = options.sortDir ?? 'desc';
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const [rows, total] = await Promise.all([
      this.prisma.appConfig.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.appConfig.count({ where }),
    ]);

    return { data: rows.map((r) => ConfigMapper.toDomain(r)), total };
  }

  async save(config: AppConfig): Promise<void> {
    const data = {
      key: config.key.value,
      value: config.value !== undefined ? (config.value as Prisma.InputJsonValue) : Prisma.JsonNull,
      description: config.description,
      isEnabled: config.isEnabled,
      scope: config.scope,
      tags: config.tags,
      createdBy: config.createdBy,
      updatedBy: config.updatedBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
    await this.prisma.appConfig.upsert({
      where: { id: config.id.value },
      create: { id: config.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appConfig.delete({ where: { id } });
  }

  async existsByKey(key: string): Promise<boolean> {
    const count = await this.prisma.appConfig.count({ where: { key } });
    return count > 0;
  }
}
