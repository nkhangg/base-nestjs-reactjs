import { UpdateAdminRoleUseCase } from './update-admin-role.use-case';
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
  Pick<AuthorizationService, 'revokeRole' | 'assignRoleWithFallback'>
> => ({
  revokeRole: jest.fn().mockResolvedValue(undefined),
  assignRoleWithFallback: jest.fn().mockResolvedValue(undefined),
});

const makeAdmin = (isActive = true) =>
  Admin.reconstitute('admin-1', {
    email: 'admin@test.com',
    passwordHash: 'hash',
    role: 'admin',
    isActive,
    createdAt: new Date(),
  });

describe('UpdateAdminRoleUseCase', () => {
  let useCase: UpdateAdminRoleUseCase;
  let repo: jest.Mocked<IAdminRepository>;
  let authService: jest.Mocked<
    Pick<AuthorizationService, 'revokeRole' | 'assignRoleWithFallback'>
  >;

  beforeEach(() => {
    repo = makeRepo();
    authService = makeAuthService();
    useCase = new UpdateAdminRoleUseCase(
      repo,
      authService as unknown as AuthorizationService,
    );
  });

  it('should update role, revoke old assignment, and assign new one', async () => {
    repo.findById.mockResolvedValue(makeAdmin());
    repo.save.mockResolvedValue();

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'editor',
    });

    expect(result.ok).toBe(true);
    const saved: Admin = repo.save.mock.calls[0][0];
    expect(saved.role).toBe('editor');
    expect(authService.revokeRole).toHaveBeenCalledWith(
      'admin-1',
      'admin',
      'admin',
    );
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      'admin-1',
      'admin',
      'editor',
    );
  });

  it('should return ADMIN_NOT_FOUND when admin does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ adminId: 'ghost', role: 'editor' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
    expect(repo.save).not.toHaveBeenCalled();
    expect(authService.revokeRole).not.toHaveBeenCalled();
  });

  it('should return ADMIN_INACTIVE when admin is deactivated', async () => {
    repo.findById.mockResolvedValue(makeAdmin(false));

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'editor',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_INACTIVE');
    expect(repo.save).not.toHaveBeenCalled();
    expect(authService.revokeRole).not.toHaveBeenCalled();
  });
});
