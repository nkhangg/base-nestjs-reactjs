import { UpdateUserRoleUseCase } from './update-user-role.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { AuthorizationService } from '../../../../core/authorization';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { UserRoleChangedEvent } from '../../domain/events/user-role-changed.event';
import { User } from '../../domain/entities/user.entity';

const makeRepo = (): jest.Mocked<IUserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

const makeAuthService = (): jest.Mocked<
  Pick<AuthorizationService, 'revokeRole' | 'assignRoleWithFallback'>
> => ({
  revokeRole: jest.fn().mockResolvedValue(undefined),
  assignRoleWithFallback: jest.fn().mockResolvedValue(undefined),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeUser = (role = 'member', isActive = true) =>
  User.reconstitute('user-1', {
    email: 'user@test.com',
    passwordHash: 'hash',
    role,
    isActive,
    createdAt: new Date(),
  });

describe('UpdateUserRoleUseCase', () => {
  let useCase: UpdateUserRoleUseCase;
  let repo: jest.Mocked<IUserRepository>;
  let authService: jest.Mocked<
    Pick<AuthorizationService, 'revokeRole' | 'assignRoleWithFallback'>
  >;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    authService = makeAuthService();
    eventBus = makeEventBus();
    useCase = new UpdateUserRoleUseCase(
      repo,
      authService as unknown as AuthorizationService,
      eventBus,
    );
  });

  it('updates role, revokes old, assigns new', async () => {
    repo.findById.mockResolvedValue(makeUser('member'));

    const result = await useCase.execute({ userId: 'user-1', role: 'premium' });

    expect(result.ok).toBe(true);
    const saved: User = repo.save.mock.calls[0][0];
    expect(saved.role).toBe('premium');
    expect(authService.revokeRole).toHaveBeenCalledWith(
      'user-1',
      'user',
      'member',
    );
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      'user-1',
      'user',
      'premium',
      'member',
    );
  });

  it('publishes UserRoleChangedEvent with old and new role', async () => {
    repo.findById.mockResolvedValue(makeUser('member'));

    await useCase.execute({ userId: 'user-1', role: 'premium' });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as UserRoleChangedEvent;
    expect(event).toBeInstanceOf(UserRoleChangedEvent);
    expect(event.eventName).toBe('user.role_changed');
    expect(event.userId).toBe('user-1');
    expect(event.oldRole).toBe('member');
    expect(event.newRole).toBe('premium');
  });

  it('returns USER_NOT_FOUND and does not publish event', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'ghost', role: 'premium' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_NOT_FOUND');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns USER_INACTIVE and does not publish event', async () => {
    repo.findById.mockResolvedValue(makeUser('member', false));

    const result = await useCase.execute({ userId: 'user-1', role: 'premium' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_INACTIVE');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
