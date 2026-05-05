import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  IUserRepository,
  FindAllUsersOptions,
  FindAllUsersResult,
} from '../../domain/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';
import type { User } from '../../domain/entities/user.entity';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.prisma.user.findUnique({ where: { email } });
    return r ? UserMapper.toDomain(r) : null;
  }

  async findById(id: string): Promise<User | null> {
    const r = await this.prisma.user.findUnique({ where: { id } });
    return r ? UserMapper.toDomain(r) : null;
  }

  async findAll(
    options: FindAllUsersOptions = {},
  ): Promise<FindAllUsersResult> {
    const where: Record<string, unknown> = {};

    if (options.isActive !== undefined) where['isActive'] = options.isActive;
    if (options.role) where['role'] = options.role;
    if (options.search) {
      where['email'] = { contains: options.search, mode: 'insensitive' };
    }
    if (options.createdAtFrom || options.createdAtTo) {
      const dateFilter: Record<string, Date> = {};
      if (options.createdAtFrom) dateFilter['gte'] = options.createdAtFrom;
      if (options.createdAtTo) dateFilter['lte'] = options.createdAtTo;
      where['createdAt'] = dateFilter;
    }

    const sortBy = options.sortBy ?? 'createdAt';
    const sortDir = options.sortDir ?? 'desc';
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: rows.map((r: UserRecord) => UserMapper.toDomain(r)), total };
  }

  async save(user: User): Promise<void> {
    const data = {
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
    await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: { id: user.id.value, ...data },
      update: data,
    });
  }
}
