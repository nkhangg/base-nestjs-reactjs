import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { RoleAssignmentRepository } from '../../domain/repositories/role-assignment.repository';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import type { SubjectType } from '../../domain/value-objects/subject.vo';

interface RoleAssignmentRecord {
  id: string;
  subjectId: string;
  subjectType: string;
  roleId: string;
  createdAt: Date;
}

@Injectable()
export class PrismaRoleAssignmentRepository implements RoleAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySubject(
    subjectId: string,
    subjectType: SubjectType,
  ): Promise<RoleAssignment[]> {
    const rows = await this.prisma.roleAssignment.findMany({
      where: { subjectId, subjectType },
    });
    return rows.map((r: RoleAssignmentRecord) => this.toDomain(r));
  }

  async findByRoleId(roleId: string): Promise<RoleAssignment[]> {
    const rows = await this.prisma.roleAssignment.findMany({
      where: { roleId },
    });
    return rows.map((r: RoleAssignmentRecord) => this.toDomain(r));
  }

  async save(assignment: RoleAssignment): Promise<void> {
    await this.prisma.roleAssignment.upsert({
      where: {
        subjectId_subjectType_roleId: {
          subjectId: assignment.subjectId,
          subjectType: assignment.subjectType,
          roleId: assignment.roleId,
        },
      },
      create: {
        id: assignment.id,
        subjectId: assignment.subjectId,
        subjectType: assignment.subjectType,
        roleId: assignment.roleId,
        createdAt: assignment.createdAt,
      },
      update: {},
    });
  }

  async delete(
    subjectId: string,
    subjectType: SubjectType,
    roleId: string,
  ): Promise<void> {
    await this.prisma.roleAssignment.deleteMany({
      where: { subjectId, subjectType, roleId },
    });
  }

  async deleteByRoleId(roleId: string): Promise<void> {
    await this.prisma.roleAssignment.deleteMany({ where: { roleId } });
  }

  private toDomain(r: RoleAssignmentRecord): RoleAssignment {
    return RoleAssignment.reconstitute(r.id, {
      subjectId: r.subjectId,
      subjectType: r.subjectType as SubjectType,
      roleId: r.roleId,
      createdAt: r.createdAt,
    });
  }
}
