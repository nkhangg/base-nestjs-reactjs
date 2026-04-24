import { Inject, Injectable } from '@nestjs/common';
import type { Action } from '../../domain/value-objects/action.vo';
import type { Subject } from '../../domain/value-objects/subject.vo';
import type { SubjectType } from '../../domain/value-objects/subject.vo';
import { Role } from '../../domain/entities/role.entity';
import { Permission } from '../../domain/entities/permission.entity';
import { RoleAssignment } from '../../domain/entities/role-assignment.entity';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '../../domain/repositories/role.repository';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
} from '../../domain/repositories/permission.repository';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  type RoleAssignmentRepository,
} from '../../domain/repositories/role-assignment.repository';
import {
  PermissionCache,
  type PermissionMap,
} from '../../infrastructure/cache/permission-cache';

export interface SeedRoleDefinition {
  name: string;
  subjectType: SubjectType;
  description?: string;
  parent?: string; // parent role name
  permissions: Record<string, Action[]>; // resource → actions, '*' = all resources
}

@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: RoleAssignmentRepository,
    private readonly cache: PermissionCache,
  ) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  async can(
    subject: Subject,
    resource: string,
    action: Action,
  ): Promise<boolean> {
    const map = await this.resolvePermissionMap(subject);

    // Wildcard resource '*' grants access to everything
    const wildcardActions = map.get('*');
    if (wildcardActions?.has(action)) return true;

    const resourceActions = map.get(resource);
    return resourceActions?.has(action) ?? false;
  }

  async assignRole(
    subjectId: string,
    subjectType: SubjectType,
    roleName: string,
  ): Promise<void> {
    const role = await this.roleRepo.findByName(roleName, subjectType);
    if (!role)
      throw new Error(
        `Role "${roleName}" not found for subjectType "${subjectType}"`,
      );

    const existing = await this.assignmentRepo.findBySubject(
      subjectId,
      subjectType,
    );
    const alreadyAssigned = existing.some((a) => a.roleId === role.id);
    if (alreadyAssigned) return;

    const assignment = RoleAssignment.create({
      subjectId,
      subjectType,
      roleId: role.id,
    });
    await this.assignmentRepo.save(assignment);
    this.cache.invalidate(subjectId, subjectType);
  }

  async revokeRole(
    subjectId: string,
    subjectType: SubjectType,
    roleName: string,
  ): Promise<void> {
    const role = await this.roleRepo.findByName(roleName, subjectType);
    if (!role) return;

    await this.assignmentRepo.delete(subjectId, subjectType, role.id);
    this.cache.invalidate(subjectId, subjectType);
  }

  /** Assigns roleName; falls back to `fallback` if the role doesn't exist. */
  async assignRoleWithFallback(
    subjectId: string,
    subjectType: SubjectType,
    roleName: string,
    fallback: string = 'viewer',
  ): Promise<void> {
    try {
      await this.assignRole(subjectId, subjectType, roleName);
    } catch {
      if (fallback !== roleName) {
        await this.assignRole(subjectId, subjectType, fallback);
      }
    }
  }

  invalidateCache(subjectId: string, subjectType?: SubjectType): void {
    this.cache.invalidate(subjectId, subjectType);
  }

  // ── Role CRUD ────────────────────────────────────────────────────────────────

  async listRoles(options?: {
    subjectType?: SubjectType;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Role[]; total: number }> {
    let roles = await this.roleRepo.findAll();

    if (options?.subjectType) {
      roles = roles.filter(
        (r) => r.subjectType === options.subjectType || r.subjectType === '*',
      );
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      roles = roles.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q),
      );
    }

    const total = roles.length;
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? total;
    const start = (page - 1) * pageSize;
    return { data: roles.slice(start, start + pageSize), total };
  }

  async listAllResources(): Promise<string[]> {
    const permissions = await this.permissionRepo.findAll();
    const resources = new Set(permissions.map((p) => p.resource));
    return [...resources].sort();
  }

  async getRoleWithPermissions(
    roleId: string,
  ): Promise<{ role: Role; permissions: Permission[] } | null> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) return null;
    const permissions = await this.permissionRepo.findByRoleId(roleId);
    return { role, permissions };
  }

  async createRole(input: {
    name: string;
    subjectType: SubjectType;
    description?: string;
    parentId?: string;
    permissions: Record<string, Action[]>;
  }): Promise<Role> {
    const existing = await this.roleRepo.findByName(
      input.name,
      input.subjectType,
    );
    if (existing)
      throw new Error(
        `Role "${input.name}" already exists for subjectType "${input.subjectType}"`,
      );

    if (input.parentId) {
      const parent = await this.roleRepo.findById(input.parentId);
      if (!parent) throw new Error(`Parent role "${input.parentId}" not found`);
    }

    const role = Role.create({
      name: input.name,
      subjectType: input.subjectType,
      description: input.description,
      parentId: input.parentId,
    });
    await this.roleRepo.save(role);

    const permissions = Object.entries(input.permissions).map(
      ([resource, actions]) =>
        Permission.create({ roleId: role.id, resource, actions }),
    );
    if (permissions.length > 0) await this.permissionRepo.saveMany(permissions);

    this.cache.clear();
    return role;
  }

  async updateRole(
    roleId: string,
    input: {
      description?: string;
      parentId?: string | null;
      permissions?: Record<string, Action[]>;
    },
  ): Promise<void> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new Error(`Role "${roleId}" not found`);

    if (input.description !== undefined)
      role.updateDescription(input.description);

    if (input.parentId !== undefined) {
      if (input.parentId !== null) {
        const parent = await this.roleRepo.findById(input.parentId);
        if (!parent)
          throw new Error(`Parent role "${input.parentId}" not found`);
        if (await this.wouldCreateCycle(roleId, input.parentId)) {
          throw new Error(
            'Setting this parent would create a circular hierarchy',
          );
        }
      }
      role.setParent(input.parentId ?? undefined);
    }

    await this.roleRepo.save(role);

    if (input.permissions !== undefined) {
      await this.permissionRepo.deleteByRoleId(roleId);
      const permissions = Object.entries(input.permissions).map(
        ([resource, actions]) =>
          Permission.create({ roleId, resource, actions }),
      );
      if (permissions.length > 0)
        await this.permissionRepo.saveMany(permissions);
    }

    this.cache.clear();
  }

  async deleteRole(roleId: string): Promise<void> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new Error(`Role "${roleId}" not found`);

    await this.assignmentRepo.deleteByRoleId(roleId);
    await this.permissionRepo.deleteByRoleId(roleId);
    await this.roleRepo.delete(roleId);
    this.cache.clear();
  }

  private async wouldCreateCycle(
    roleId: string,
    candidateParentId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    let current: string | undefined = candidateParentId;
    while (current) {
      if (current === roleId) return true;
      if (visited.has(current)) return true;
      visited.add(current);
      const r = await this.roleRepo.findById(current);
      current = r?.parentId;
    }
    return false;
  }

  /**
   * Idempotent — safe to call on every onModuleInit.
   * Upserts roles and replaces their permissions.
   */
  async seedRoles(definitions: SeedRoleDefinition[]): Promise<void> {
    // First pass: upsert all roles (without parent wiring)
    const roleMap = new Map<string, Role>();

    for (const def of definitions) {
      let role = await this.roleRepo.findByName(def.name, def.subjectType);
      if (!role) {
        role = Role.create({
          name: def.name,
          subjectType: def.subjectType,
          description: def.description,
        });
      }
      roleMap.set(def.name, role);
    }

    // Second pass: wire parent references
    for (const def of definitions) {
      const role = roleMap.get(def.name)!;
      if (def.parent) {
        const parent = roleMap.get(def.parent);
        if (parent) role.setParent(parent.id);
      }
      await this.roleRepo.save(role);
    }

    // Third pass: replace permissions (idempotent via deleteByRoleId + saveMany)
    for (const def of definitions) {
      const role = roleMap.get(def.name)!;
      await this.permissionRepo.deleteByRoleId(role.id);

      const permissions = Object.entries(def.permissions).map(
        ([resource, actions]) =>
          Permission.create({ roleId: role.id, resource, actions }),
      );
      if (permissions.length > 0) {
        await this.permissionRepo.saveMany(permissions);
      }
    }

    this.cache.clear();
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private async resolvePermissionMap(subject: Subject): Promise<PermissionMap> {
    const cached = this.cache.get(subject.id, subject.type);
    if (cached) return cached;

    const assignments = await this.assignmentRepo.findBySubject(
      subject.id,
      subject.type,
    );
    const map: PermissionMap = new Map();

    for (const assignment of assignments) {
      await this.mergeRolePermissions(assignment.roleId, map, new Set());
    }

    this.cache.set(subject.id, subject.type, map);
    return map;
  }

  /** Recursively loads permissions up the parent chain (cycle-safe via visited set). */
  private async mergeRolePermissions(
    roleId: string,
    map: PermissionMap,
    visited: Set<string>,
  ): Promise<void> {
    if (visited.has(roleId)) return;
    visited.add(roleId);

    const role = await this.roleRepo.findById(roleId);
    if (!role) return;

    // Traverse parent first so child permissions override parent
    if (role.parentId) {
      await this.mergeRolePermissions(role.parentId, map, visited);
    }

    const permissions = await this.permissionRepo.findByRoleId(roleId);
    for (const perm of permissions) {
      const existing = map.get(perm.resource) ?? new Set<Action>();
      for (const action of perm.actions) existing.add(action);
      map.set(perm.resource, existing);
    }
  }
}
