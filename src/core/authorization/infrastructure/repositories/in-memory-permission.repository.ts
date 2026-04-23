import { Injectable } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/permission.repository';
import type { Permission } from '../../domain/entities/permission.entity';

@Injectable()
export class InMemoryPermissionRepository implements PermissionRepository {
  private readonly store = new Map<string, Permission>();

  async findByRoleId(roleId: string): Promise<Permission[]> {
    return [...this.store.values()].filter((p) => p.roleId === roleId);
  }

  async findAll(): Promise<Permission[]> {
    return [...this.store.values()];
  }

  async saveMany(permissions: Permission[]): Promise<void> {
    for (const p of permissions) {
      this.store.set(p.id, p);
    }
  }

  async deleteByRoleId(roleId: string): Promise<void> {
    for (const [id, p] of this.store.entries()) {
      if (p.roleId === roleId) this.store.delete(id);
    }
  }
}
