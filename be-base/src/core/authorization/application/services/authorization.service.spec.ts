import {
  AuthorizationService,
  type SeedRoleDefinition,
} from './authorization.service';
import { InMemoryRoleRepository } from '../../infrastructure/repositories/in-memory-role.repository';
import { InMemoryPermissionRepository } from '../../infrastructure/repositories/in-memory-permission.repository';
import { InMemoryRoleAssignmentRepository } from '../../infrastructure/repositories/in-memory-role-assignment.repository';
import { PermissionCache } from '../../infrastructure/cache/permission-cache';
import { Subject } from '../../domain/value-objects/subject.vo';

function makeService() {
  const roleRepo = new InMemoryRoleRepository();
  const permissionRepo = new InMemoryPermissionRepository();
  const assignmentRepo = new InMemoryRoleAssignmentRepository();
  const cache = new PermissionCache();
  const service = new AuthorizationService(
    roleRepo,
    permissionRepo,
    assignmentRepo,
    cache,
  );
  return { service, roleRepo, permissionRepo, assignmentRepo, cache };
}

const adminSubject = Subject.of('admin-1', 'admin');

describe('AuthorizationService', () => {
  describe('seedRoles + can()', () => {
    it('grants access when subject has a matching role', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'editor',
          subjectType: 'admin',
          permissions: { products: ['create', 'read', 'update'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'editor');

      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);
      expect(await service.can(adminSubject, 'products', 'create')).toBe(true);
      expect(await service.can(adminSubject, 'products', 'delete')).toBe(false);
    });

    it('wildcard resource grants all resources', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'super-admin',
          subjectType: 'admin',
          permissions: {
            '*': [
              'create',
              'read',
              'update',
              'delete',
              'publish',
              'approve',
              'export',
            ],
          },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'super-admin');

      expect(await service.can(adminSubject, 'products', 'delete')).toBe(true);
      expect(await service.can(adminSubject, 'orders', 'approve')).toBe(true);
      expect(await service.can(adminSubject, 'anything', 'export')).toBe(true);
    });

    it('denies access when subject has no role assignment', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);

      expect(await service.can(adminSubject, 'products', 'read')).toBe(false);
    });

    it('denies access when action not in role permissions', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'viewer');

      expect(await service.can(adminSubject, 'products', 'delete')).toBe(false);
    });
  });

  describe('role hierarchy (parent)', () => {
    it('inherits parent permissions', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
        {
          name: 'editor',
          subjectType: 'admin',
          parent: 'viewer',
          permissions: { '*': ['create', 'update'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'editor');

      // own permissions
      expect(await service.can(adminSubject, 'products', 'create')).toBe(true);
      // inherited from viewer
      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);
      // not granted by either
      expect(await service.can(adminSubject, 'products', 'delete')).toBe(false);
    });

    it('child permissions override/extend parent for same resource', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { products: ['read'] },
        },
        {
          name: 'editor',
          subjectType: 'admin',
          parent: 'viewer',
          permissions: { products: ['create', 'update'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'editor');

      // merged: read (parent) + create + update (child)
      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);
      expect(await service.can(adminSubject, 'products', 'create')).toBe(true);
    });
  });

  describe('seedRoles idempotency', () => {
    it('running seedRoles twice does not duplicate permissions', async () => {
      const { service, permissionRepo, roleRepo } = makeService();

      const def: SeedRoleDefinition[] = [
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ];
      await service.seedRoles(def);
      await service.seedRoles(def);

      const roles = await roleRepo.findAll();
      expect(roles).toHaveLength(1);

      const perms = await permissionRepo.findByRoleId(roles[0].id);
      expect(perms).toHaveLength(1);
    });
  });

  describe('cache', () => {
    it('serves permission from cache on second call', async () => {
      const { service, assignmentRepo } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'viewer');

      // Warm cache
      await service.can(adminSubject, 'products', 'read');

      // Spy on assignmentRepo — should NOT be called again (cache hit)
      const spy = jest.spyOn(assignmentRepo, 'findBySubject');
      await service.can(adminSubject, 'products', 'read');
      expect(spy).not.toHaveBeenCalled();
    });

    it('invalidateCache clears entry so next call re-queries', async () => {
      const { service, assignmentRepo } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'viewer');
      await service.can(adminSubject, 'products', 'read'); // warm

      service.invalidateCache('admin-1', 'admin');

      const spy = jest.spyOn(assignmentRepo, 'findBySubject');
      await service.can(adminSubject, 'products', 'read');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('assignRole / revokeRole', () => {
    it('assigning the same role twice is idempotent', async () => {
      const { service, assignmentRepo } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'viewer');
      await service.assignRole('admin-1', 'admin', 'viewer');

      const assignments = await assignmentRepo.findBySubject(
        'admin-1',
        'admin',
      );
      expect(assignments).toHaveLength(1);
    });

    it('revokeRole removes access', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRole('admin-1', 'admin', 'viewer');
      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);

      await service.revokeRole('admin-1', 'admin', 'viewer');
      expect(await service.can(adminSubject, 'products', 'read')).toBe(false);
    });
  });

  describe('assignRoleWithFallback', () => {
    it('assigns the given role when it exists', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRoleWithFallback('admin-1', 'admin', 'viewer');

      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);
    });

    it('falls back to viewer when role does not exist', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      await service.assignRoleWithFallback(
        'admin-1',
        'admin',
        'nonexistent-role',
      );

      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);
    });
  });

  describe('listRoles', () => {
    it('returns all roles when no subjectType filter', async () => {
      const { service } = makeService();

      await service.seedRoles([
        { name: 'viewer', subjectType: 'admin', permissions: {} },
        { name: 'member', subjectType: 'user', permissions: {} },
      ]);

      const { data } = await service.listRoles();
      expect(data).toHaveLength(2);
    });

    it('filters by subjectType', async () => {
      const { service } = makeService();

      await service.seedRoles([
        { name: 'viewer', subjectType: 'admin', permissions: {} },
        { name: 'member', subjectType: 'user', permissions: {} },
      ]);

      const { data } = await service.listRoles({ subjectType: 'admin' });
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('viewer');
    });
  });

  describe('getRoleWithPermissions', () => {
    it('returns role and its permissions', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'editor',
          subjectType: 'admin',
          permissions: { products: ['create', 'update'] },
        },
      ]);

      const { data } = await service.listRoles({ subjectType: 'admin' });
      const result = await service.getRoleWithPermissions(data[0].id);

      expect(result).not.toBeNull();
      expect(result!.role.name).toBe('editor');
      expect(result!.permissions).toHaveLength(1);
      expect(result!.permissions[0].resource).toBe('products');
    });

    it('returns null for unknown role id', async () => {
      const { service } = makeService();
      const result = await service.getRoleWithPermissions('nonexistent-id');
      expect(result).toBeNull();
    });
  });

  describe('createRole', () => {
    it('creates role with permissions and grants access', async () => {
      const { service } = makeService();

      const role = await service.createRole({
        name: 'publisher',
        subjectType: 'admin',
        description: 'Can publish',
        permissions: { articles: ['create', 'publish'] },
      });

      expect(role.name).toBe('publisher');
      await service.assignRole('admin-1', 'admin', 'publisher');
      expect(await service.can(adminSubject, 'articles', 'publish')).toBe(true);
    });

    it('throws when role name already exists for same subjectType', async () => {
      const { service } = makeService();

      await service.seedRoles([
        { name: 'viewer', subjectType: 'admin', permissions: {} },
      ]);

      await expect(
        service.createRole({
          name: 'viewer',
          subjectType: 'admin',
          permissions: {},
        }),
      ).rejects.toThrow('already exists');
    });

    it('throws when parentId does not exist', async () => {
      const { service } = makeService();

      await expect(
        service.createRole({
          name: 'child',
          subjectType: 'admin',
          permissions: {},
          parentId: 'nonexistent-id',
        }),
      ).rejects.toThrow('Parent role');
    });
  });

  describe('updateRole', () => {
    it('updates description', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'viewer',
          subjectType: 'admin',
          permissions: { '*': ['read'] },
        },
      ]);
      const {
        data: [role],
      } = await service.listRoles({ subjectType: 'admin' });

      await service.updateRole(role.id, { description: 'Updated desc' });

      const result = await service.getRoleWithPermissions(role.id);
      expect(result!.role.description).toBe('Updated desc');
    });

    it('replaces permissions when provided', async () => {
      const { service } = makeService();

      await service.seedRoles([
        {
          name: 'editor',
          subjectType: 'admin',
          permissions: { products: ['create'] },
        },
      ]);
      const {
        data: [role],
      } = await service.listRoles({ subjectType: 'admin' });

      await service.updateRole(role.id, {
        permissions: { products: ['create', 'update', 'delete'] },
      });
      await service.assignRole('admin-1', 'admin', 'editor');

      expect(await service.can(adminSubject, 'products', 'delete')).toBe(true);
    });

    it('detects circular hierarchy', async () => {
      const { service } = makeService();

      await service.seedRoles([
        { name: 'parent', subjectType: 'admin', permissions: {} },
        {
          name: 'child',
          subjectType: 'admin',
          permissions: {},
          parent: 'parent',
        },
      ]);
      const { data: roles } = await service.listRoles({ subjectType: 'admin' });
      const parent = roles.find((r) => r.name === 'parent')!;
      const child = roles.find((r) => r.name === 'child')!;

      await expect(
        service.updateRole(parent.id, { parentId: child.id }),
      ).rejects.toThrow('circular');
    });

    it('throws when role not found', async () => {
      const { service } = makeService();
      await expect(
        service.updateRole('nonexistent', { description: 'x' }),
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteRole', () => {
    it('removes the role and its permissions', async () => {
      const { service } = makeService();

      await service.seedRoles([
        { name: 'temp', subjectType: 'admin', permissions: { '*': ['read'] } },
      ]);
      const {
        data: [role],
      } = await service.listRoles({ subjectType: 'admin' });
      await service.deleteRole(role.id);

      const { data: remaining } = await service.listRoles({
        subjectType: 'admin',
      });
      expect(remaining).toHaveLength(0);
    });

    it('revokes access for subjects that held the deleted role', async () => {
      const { service } = makeService();

      await service.seedRoles([
        { name: 'temp', subjectType: 'admin', permissions: { '*': ['read'] } },
      ]);
      const {
        data: [role],
      } = await service.listRoles({ subjectType: 'admin' });
      await service.assignRole('admin-1', 'admin', 'temp');
      expect(await service.can(adminSubject, 'products', 'read')).toBe(true);

      await service.deleteRole(role.id);
      expect(await service.can(adminSubject, 'products', 'read')).toBe(false);
    });

    it('throws when role not found', async () => {
      const { service } = makeService();
      await expect(service.deleteRole('nonexistent')).rejects.toThrow(
        'not found',
      );
    });
  });
});
