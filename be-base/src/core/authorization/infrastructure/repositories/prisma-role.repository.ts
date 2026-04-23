import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { RoleRepository } from '../../domain/repositories/role.repository';
import { Role } from '../../domain/entities/role.entity';
import type { SubjectType } from '../../domain/value-objects/subject.vo';

interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  subjectType: string;
  parentId: string | null;
}

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Role | null> {
    const r = await this.prisma.role.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByName(
    name: string,
    subjectType: SubjectType,
  ): Promise<Role | null> {
    const r = await this.prisma.role.findFirst({
      where: { name, OR: [{ subjectType }, { subjectType: '*' }] },
    });
    return r ? this.toDomain(r) : null;
  }

  async findAll(): Promise<Role[]> {
    const rows = await this.prisma.role.findMany();
    return rows.map((r: RoleRecord) => this.toDomain(r));
  }

  async save(role: Role): Promise<void> {
    const data = {
      name: role.name,
      description: role.description ?? null,
      subjectType: role.subjectType,
      parentId: role.parentId ?? null,
    };
    await this.prisma.role.upsert({
      where: { id: role.id },
      create: { id: role.id, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  private toDomain(r: RoleRecord): Role {
    return Role.reconstitute(r.id, {
      name: r.name,
      description: r.description ?? undefined,
      subjectType: r.subjectType as SubjectType,
      parentId: r.parentId ?? undefined,
    });
  }
}
