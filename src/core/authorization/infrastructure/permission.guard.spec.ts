import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PermissionGuard,
  UserPermissionGuard,
  MerchantPermissionGuard,
} from './permission.guard';
import { InMemoryRoleRepository } from './repositories/in-memory-role.repository';
import { InMemoryPermissionRepository } from './repositories/in-memory-permission.repository';
import { InMemoryRoleAssignmentRepository } from './repositories/in-memory-role-assignment.repository';
import { PermissionCache } from './cache/permission-cache';
import { AuthorizationService } from '../application/services/authorization.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

function makeService() {
  const roleRepo = new InMemoryRoleRepository();
  const permissionRepo = new InMemoryPermissionRepository();
  const assignmentRepo = new InMemoryRoleAssignmentRepository();
  const cache = new PermissionCache();
  return new AuthorizationService(
    roleRepo,
    permissionRepo,
    assignmentRepo,
    cache,
  );
}

function makeContext(overrides: {
  user?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): ExecutionContext {
  const getRequest = jest
    .fn()
    .mockReturnValue({ user: overrides.user ?? undefined });
  const getHandler = jest.fn();
  const getClass = jest.fn();
  return {
    switchToHttp: () => ({ getRequest }),
    getHandler,
    getClass,
  } as unknown as ExecutionContext;
}

function makeReflector(metadata: unknown): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(metadata),
  } as unknown as Reflector;
}

async function seedAndAssign(service: AuthorizationService) {
  await service.seedRoles([
    {
      name: 'member',
      subjectType: 'user',
      permissions: { profile: ['read', 'update'], orders: ['create', 'read'] },
    },
  ]);
  await service.assignRole('user-1', 'user', 'member');
}

describe('PermissionGuard', () => {
  it('throws 401 when req.user is missing', async () => {
    const guard = new PermissionGuard(makeService(), makeReflector(null));
    const ctx = makeContext({ user: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true when no @Permission metadata', async () => {
    const guard = new PermissionGuard(makeService(), makeReflector(undefined));
    const ctx = makeContext({ user: { userId: 'u1', type: 'user' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws 403 when subjectType does not match', async () => {
    const guard = new PermissionGuard(
      makeService(),
      makeReflector({
        resource: 'profile',
        action: 'read',
        subjectType: 'user',
      }),
    );
    const ctx = makeContext({ user: { userId: 'm1', type: 'merchant' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws 403 when RBAC check fails', async () => {
    const service = makeService();
    await seedAndAssign(service);
    const guard = new PermissionGuard(
      service,
      makeReflector({ resource: 'profile', action: 'delete' }),
    );
    const ctx = makeContext({ user: { userId: 'user-1', type: 'user' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('returns true when RBAC check passes', async () => {
    const service = makeService();
    await seedAndAssign(service);
    const guard = new PermissionGuard(
      service,
      makeReflector({ resource: 'profile', action: 'read' }),
    );
    const ctx = makeContext({ user: { userId: 'user-1', type: 'user' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('passes when subjectType matches and RBAC grants access', async () => {
    const service = makeService();
    await seedAndAssign(service);
    const guard = new PermissionGuard(
      service,
      makeReflector({
        resource: 'orders',
        action: 'create',
        subjectType: 'user',
      }),
    );
    const ctx = makeContext({ user: { userId: 'user-1', type: 'user' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});

describe('UserPermissionGuard', () => {
  it('throws 401 when type is not user', async () => {
    const guard = new UserPermissionGuard(
      makeService(),
      makeReflector(undefined),
    );
    const ctx = makeContext({ user: { userId: 'm1', type: 'merchant' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when req.user is missing', async () => {
    const guard = new UserPermissionGuard(
      makeService(),
      makeReflector(undefined),
    );
    const ctx = makeContext({ user: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true for authenticated user with correct type and no metadata', async () => {
    const guard = new UserPermissionGuard(
      makeService(),
      makeReflector(undefined),
    );
    const ctx = makeContext({ user: { userId: 'u1', type: 'user' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true for user with valid permission', async () => {
    const service = makeService();
    await seedAndAssign(service);
    const guard = new UserPermissionGuard(
      service,
      makeReflector({ resource: 'orders', action: 'read' }),
    );
    const ctx = makeContext({ user: { userId: 'user-1', type: 'user' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});

describe('MerchantPermissionGuard', () => {
  it('throws 401 when type is not merchant', async () => {
    const guard = new MerchantPermissionGuard(
      makeService(),
      makeReflector(undefined),
    );
    const ctx = makeContext({ user: { userId: 'u1', type: 'user' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('returns true for merchant with no metadata', async () => {
    const guard = new MerchantPermissionGuard(
      makeService(),
      makeReflector(undefined),
    );
    const ctx = makeContext({ user: { userId: 'm1', type: 'merchant' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('returns true for merchant with valid permission', async () => {
    const service = makeService();
    await service.seedRoles([
      {
        name: 'staff',
        subjectType: 'merchant',
        permissions: { products: ['read', 'update'] },
      },
    ]);
    await service.assignRole('merchant-1', 'merchant', 'staff');
    const guard = new MerchantPermissionGuard(
      service,
      makeReflector({ resource: 'products', action: 'read' }),
    );
    const ctx = makeContext({
      user: { userId: 'merchant-1', type: 'merchant' },
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws 403 for merchant missing permission', async () => {
    const service = makeService();
    await service.seedRoles([
      {
        name: 'staff',
        subjectType: 'merchant',
        permissions: { products: ['read'] },
      },
    ]);
    await service.assignRole('merchant-1', 'merchant', 'staff');
    const guard = new MerchantPermissionGuard(
      service,
      makeReflector({ resource: 'products', action: 'delete' }),
    );
    const ctx = makeContext({
      user: { userId: 'merchant-1', type: 'merchant' },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});

describe('PERMISSION_KEY', () => {
  it('is a unique string key', () => {
    expect(typeof PERMISSION_KEY).toBe('string');
    expect(PERMISSION_KEY).not.toBe('admin_permission');
  });
});
