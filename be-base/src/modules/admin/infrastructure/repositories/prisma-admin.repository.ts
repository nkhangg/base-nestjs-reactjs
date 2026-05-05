import { Injectable } from '@nestjs/common';
import type {
  IAdminRepository,
  FindAllOptions,
  FindAllResult,
} from '../../domain/repositories/admin.repository';
import { Admin } from '../../domain/entities/admin.entity';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

interface AdminRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Admin | null> {
    const r = await this.prisma.admin.findUnique({ where: { email } });
    return r ? this.toDomain(r) : null;
  }

  async findById(id: string): Promise<Admin | null> {
    const r = await this.prisma.admin.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where: Record<string, unknown> = {};

    if (options?.isActive !== undefined) {
      where['isActive'] = options.isActive;
    }

    if (options?.search) {
      where['OR'] = [
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = options?.sortBy ?? 'createdAt';
    const sortDir = options?.sortDir ?? 'desc';
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;

    const [rows, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.admin.count({ where }),
    ]);

    return { data: rows.map((r: AdminRecord) => this.toDomain(r)), total };
  }

  async save(admin: Admin): Promise<void> {
    const data = {
      email: admin.email,
      passwordHash: admin.passwordHash,
      name: admin.name ?? null,
      phone: admin.phone ?? null,
      avatarUrl: admin.avatarUrl ?? null,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
    await this.prisma.admin.upsert({
      where: { id: admin.id.value },
      create: { id: admin.id.value, ...data },
      update: data,
    });
  }

  private toDomain(r: AdminRecord): Admin {
    return Admin.reconstitute(r.id, {
      email: r.email,
      passwordHash: r.passwordHash,
      name: r.name,
      phone: r.phone,
      avatarUrl: r.avatarUrl,
      isActive: r.isActive,
      createdAt: r.createdAt,
    });
  }
}
