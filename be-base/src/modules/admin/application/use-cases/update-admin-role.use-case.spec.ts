import { UpdateAdminRoleUseCase } from './update-admin-role.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { AuthorizationService } from '../../../../core/authorization';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { AdminRoleChangedEvent } from '../../domain/events/admin-role-changed.event';
import { Admin } from '../../domain/entities/admin.entity';

const makeRepo = (): jest.Mocked<IAdminRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
});

const makeAuthService = (): jest.Mocked<
  Pick<AuthorizationService, 'revokeRole' | 'assignRoleWithFallback' | 'getAssignedRoleNames'>
> => ({
  revokeRole: jest.fn().mockResolvedValue(undefined),
  assignRoleWithFallback: jest.fn().mockResolvedValue(undefined),
  getAssignedRoleNames: jest.fn().mockResolvedValue(['admin']),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeAdmin = (isActive = true) =>
  Admin.reconstitute('admin-1', {
    email: 'admin@test.com',
    passwordHash: 'hash',
    isActive,
    createdAt: new Date(),
  });

describe('UpdateAdminRoleUseCase', () => {
  let useCase: UpdateAdminRoleUseCase;
  let repo: jest.Mocked<IAdminRepository>;
  let authService: jest.Mocked<
    Pick<AuthorizationService, 'revokeRole' | 'assignRoleWithFallback' | 'getAssignedRoleNames'>
  >;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    authService = makeAuthService();
    eventBus = makeEventBus();
    useCase = new UpdateAdminRoleUseCase(
      repo,
      authService as unknown as AuthorizationService,
      eventBus,
    );
  });

  it('should revoke old roles and assign new one', async () => {
    repo.findById.mockResolvedValue(makeAdmin());
    repo.save.mockResolvedValue();

    const result = await useCase.execute({
      adminId: 'admin-1',
      role: 'editor',
    });

    expect(result.ok).toBe(true);
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

  it('should publish AdminRoleChangedEvent with new role', async () => {
    repo.findById.mockResolvedValue(makeAdmin());
    repo.save.mockResolvedValue();

    await useCase.execute({ adminId: 'admin-1', role: 'editor' });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as AdminRoleChangedEvent;
    expect(event).toBeInstanceOf(AdminRoleChangedEvent);
    expect(event.eventName).toBe('admin.role_changed');
    expect(event.adminId).toBe('admin-1');
    expect(event.newRole).toBe('editor');
  });

  it('should NOT publish event when admin not found or inactive', async () => {
    repo.findById.mockResolvedValue(null);
    await useCase.execute({ adminId: 'ghost', role: 'editor' });
    expect(eventBus.publish).not.toHaveBeenCalled();

    repo.findById.mockResolvedValue(makeAdmin(false));
    await useCase.execute({ adminId: 'admin-1', role: 'editor' });
    expect(eventBus.publish).not.toHaveBeenCalled();
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
