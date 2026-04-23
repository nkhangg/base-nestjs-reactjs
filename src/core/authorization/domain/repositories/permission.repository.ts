import type { Permission } from '../entities/permission.entity';

export interface PermissionRepository {
  findByRoleId(roleId: string): Promise<Permission[]>;
  findAll(): Promise<Permission[]>;
  saveMany(permissions: Permission[]): Promise<void>;
  deleteByRoleId(roleId: string): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
