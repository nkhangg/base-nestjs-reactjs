import { ActivateUserUseCase } from './activate-user.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { AuthorizationService } from '../../../../core/authorization';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { UserActivatedEvent } from '../../domain/events/user-activated.event';
import { User } from '../../domain/entities/user.entity';

const makeRepo = (): jest.Mocked<IUserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

const makeAuthService = (): jest.Mocked<
  Pick<AuthorizationService, 'assignRoleWithFallback'>
> => ({
  assignRoleWithFallback: jest.fn().mockResolvedValue(undefined),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeInactiveUser = (id = 'user-1') =>
  User.reconstitute(id, {
    email: `${id}@test.com`,
    passwordHash: 'hash',
    role: 'member',
    isActive: false,
    createdAt: new Date(),
  });

const makeActiveUser = (id = 'user-1') =>
  User.reconstitute(id, {
    email: `${id}@test.com`,
    passwordHash: 'hash',
    role: 'member',
    isActive: true,
    createdAt: new Date(),
  });

describe('ActivateUserUseCase', () => {
  let useCase: ActivateUserUseCase;
  let repo: jest.Mocked<IUserRepository>;
  let authService: jest.Mocked<
    Pick<AuthorizationService, 'assignRoleWithFallback'>
  >;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    authService = makeAuthService();
    eventBus = makeEventBus();
    useCase = new ActivateUserUseCase(
      repo,
      authService as unknown as AuthorizationService,
      eventBus,
    );
  });

  it('activates user and saves', async () => {
    repo.findById.mockResolvedValue(makeInactiveUser());

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.ok).toBe(true);
    const saved: User = repo.save.mock.calls[0][0];
    expect(saved.isActive).toBe(true);
  });

  it('publishes UserActivatedEvent', async () => {
    repo.findById.mockResolvedValue(makeInactiveUser('user-2'));

    await useCase.execute({ userId: 'user-2' });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as UserActivatedEvent;
    expect(event).toBeInstanceOf(UserActivatedEvent);
    expect(event.eventName).toBe('user.activated');
    expect(event.userId).toBe('user-2');
  });

  it('returns USER_NOT_FOUND and does not publish event', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'ghost' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_NOT_FOUND');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns USER_ALREADY_ACTIVE and does not publish event', async () => {
    repo.findById.mockResolvedValue(makeActiveUser());

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_ALREADY_ACTIVE');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
