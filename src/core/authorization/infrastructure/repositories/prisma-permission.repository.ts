import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { PermissionRepository } from '../../domain/repositories/permission.repository';
import { Permission } from '../../domain/entities/permission.entity';
import type { Action } from '../../domain/value-objects/action.vo';

interface PermissionRecord {
  id: string;
  roleId: string;
  resource: string;
  actions: string[];
}

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRoleId(roleId: string): Promise<Permission[]> {
    const rows = await this.prisma.permission.findMany({ where: { roleId } });
    return rows.map((r: PermissionRecord) => this.toDomain(r));
  }

  async findAll(): Promise<Permission[]> {
    const rows = await this.prisma.permission.findMany();
    return rows.map((r: PermissionRecord) => this.toDomain(r));
  }

  async saveMany(permissions: Permission[]): Promise<void> {
    if (permissions.length === 0) return;
    await this.prisma.$transaction(
      permissions.map((p) =>
        this.prisma.permission.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            roleId: p.roleId,
            resource: p.resource,
            actions: p.actions,
          },
          update: { resource: p.resource, actions: p.actions },
        }),
      ),
    );
  }

  async deleteByRoleId(roleId: string): Promise<void> {
    await this.prisma.permission.deleteMany({ where: { roleId } });
  }

  private toDomain(r: PermissionRecord): Permission {
    return Permission.reconstitute(r.id, {
      roleId: r.roleId,
      resource: r.resource,
      actions: r.actions as Action[],
    });
  }
}
