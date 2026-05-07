import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Organization } from '../../domain/entities/organization.entity';
import type { IOrganizationRepository } from '../../domain/repositories/organization.repository';
import { OrganizationMapper } from '../mappers/organization.mapper';

@Injectable()
export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization | null> {
    const r = await this.prisma.organization.findUnique({ where: { id } });
    return r ? OrganizationMapper.toDomain(r) : null;
  }

  async findByOwner(
    ownerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Organization[]; total: number }> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.organization.findMany({
        where: { ownerId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where: { ownerId } }),
    ]);
    return { data: rows.map(OrganizationMapper.toDomain), total };
  }

  async findAll(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<{ data: Organization[]; total: number }> {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};
    const skip = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);
    return { data: rows.map(OrganizationMapper.toDomain), total };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.delete({ where: { id } });
  }

  async save(org: Organization): Promise<void> {
    const data = {
      name: org.name,
      ownerId: org.ownerId,
      createdAt: org.createdAt,
    };
    await this.prisma.organization.upsert({
      where: { id: org.id.value },
      create: { id: org.id.value, ...data },
      update: data,
    });
  }
}
