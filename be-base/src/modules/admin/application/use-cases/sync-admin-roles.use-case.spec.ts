import { SyncAdminRolesUseCase } from './sync-admin-roles.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { AuthorizationService } from '../../../../core/authorization';
import { Admin } from '../../domain/entities/admin.entity';

const makeRepo = (): jest.Mocked<IAdminRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
});

const makeAuthService = (): jest.Mocked<
  Pick<
    AuthorizationService,
    'revokeRole' | 'assignRoleWithFallback' | 'getAssignedRoleNames'
  >
> => ({
  revokeRole: jest.fn().mockResolvedValue(undefined),
  assignRoleWithFallback: jest.fn().mockResolvedValue(undefined),
  getAssignedRoleNames: jest.fn().mockResolvedValue(['super-admin']),
});

const makeAdmin = (id = 'admin-1', isActive = true) =>
  Admin.reconstitute(id, {
    email: `${id}@test.com`,
    passwordHash: 'hash',
    isActive,
    createdAt: new Date(),
  });

describe('SyncAdminRolesUseCase', () => {
  let useCase: SyncAdminRolesUseCase;
  let repo: jest.Mocked<IAdminRepository>;
  let authService: jest.Mocked<
    Pick<
      AuthorizationService,
      'revokeRole' | 'assignRoleWithFallback' | 'getAssignedRoleNames'
    >
  >;

  beforeEach(() => {
    repo = makeRepo();
    authService = makeAuthService();
    useCase = new SyncAdminRolesUseCase(
      repo,
      authService as unknown as AuthorizationService,
    );
  });

  it('should return CANNOT_UPDATE_SELF_ROLES when requesterId equals adminId', async () => {
    const result = await useCase.execute({
      adminId: 'admin-1',
      requesterId: 'admin-1',
      roles: ['editor'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CANNOT_UPDATE_SELF_ROLES');
    expect(repo.findById).not.toHaveBeenCalled();
    expect(authService.revokeRole).not.toHaveBeenCalled();
    expect(authService.assignRoleWithFallback).not.toHaveBeenCalled();
  });

  it('should allow update when requesterId differs from adminId', async () => {
    repo.findById.mockResolvedValue(makeAdmin('admin-1'));

    const result = await useCase.execute({
      adminId: 'admin-1',
      requesterId: 'admin-2',
      roles: ['editor'],
    });

    expect(result.ok).toBe(true);
  });

  it('should allow update when requesterId is omitted', async () => {
    repo.findById.mockResolvedValue(makeAdmin('admin-1'));

    const result = await useCase.execute({
      adminId: 'admin-1',
      roles: ['editor'],
    });

    expect(result.ok).toBe(true);
  });

  it('should revoke removed roles and assign added roles', async () => {
    repo.findById.mockResolvedValue(makeAdmin('admin-1'));
    authService.getAssignedRoleNames.mockResolvedValue([
      'super-admin',
      'editor',
    ]);

    await useCase.execute({
      adminId: 'admin-1',
      requesterId: 'admin-2',
      roles: ['editor', 'moderator'],
    });

    expect(authService.revokeRole).toHaveBeenCalledWith(
      'admin-1',
      'admin',
      'super-admin',
    );
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      'admin-1',
      'admin',
      'moderator',
    );
    expect(authService.revokeRole).not.toHaveBeenCalledWith(
      'admin-1',
      'admin',
      'editor',
    );
    expect(authService.assignRoleWithFallback).not.toHaveBeenCalledWith(
      'admin-1',
      'admin',
      'editor',
    );
  });

  it('should return ADMIN_NOT_FOUND when admin does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      adminId: 'ghost',
      roles: ['editor'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
  });

  it('should return ADMIN_INACTIVE when admin is deactivated', async () => {
    repo.findById.mockResolvedValue(makeAdmin('admin-1', false));

    const result = await useCase.execute({
      adminId: 'admin-1',
      roles: ['editor'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_INACTIVE');
  });
});
