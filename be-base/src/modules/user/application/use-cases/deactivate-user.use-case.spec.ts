import { DeactivateUserUseCase } from './deactivate-user.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { SessionRepository } from '../../../../core/auth/domain/repositories/session.repository';
import type { AuthorizationService } from '../../../../core/authorization';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { UserDeactivatedEvent } from '../../domain/events/user-deactivated.event';
import { User } from '../../domain/entities/user.entity';
import { Session } from '../../../../core/auth/domain/entities/session.entity';
import { DeviceInfo } from '../../../../core/auth/domain/value-objects/device-info.vo';

const makeRepo = (): jest.Mocked<IUserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  findByOAuthProvider: jest.fn(),
  saveOAuthAccount: jest.fn().mockResolvedValue(undefined),
});

const makeSessionRepo = (): jest.Mocked<SessionRepository> => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
});

const makeAuthService = (): jest.Mocked<
  Pick<AuthorizationService, 'invalidateCache'>
> => ({
  invalidateCache: jest.fn(),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeActiveUser = (id = 'user-1') =>
  User.reconstitute(id, {
    email: `${id}@test.com`,
    passwordHash: 'hash',
    role: 'member',
    isActive: true,
    xpTotal: 0,
    streakCount: 0,
    settings: {},
    createdAt: new Date(),
  });

const makeSession = (id: string, userId: string) =>
  Session.reconstitute(id, {
    userId,
    userEmail: 'test@example.com',
    userType: 'user',
    isAdmin: false,
    refreshTokenHash: 'hash',
    deviceInfo: DeviceInfo.create({
      deviceName: 'Chrome',
      ipAddress: '127.0.0.1',
      userAgent: 'UA',
    }),
    isActive: true,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 86400_000),
    createdAt: new Date(),
  });

describe('DeactivateUserUseCase', () => {
  let useCase: DeactivateUserUseCase;
  let repo: jest.Mocked<IUserRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let authService: jest.Mocked<Pick<AuthorizationService, 'invalidateCache'>>;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    sessionRepo = makeSessionRepo();
    authService = makeAuthService();
    eventBus = makeEventBus();
    useCase = new DeactivateUserUseCase(
      repo,
      sessionRepo,
      authService as unknown as AuthorizationService,
      eventBus,
    );
  });

  it('deactivates user, revokes all sessions, invalidates cache', async () => {
    repo.findById.mockResolvedValue(makeActiveUser('user-1'));
    sessionRepo.findByUserId.mockResolvedValue([
      makeSession('s1', 'user-1'),
      makeSession('s2', 'user-1'),
    ]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.ok).toBe(true);
    const saved: User = repo.save.mock.calls[0][0];
    expect(saved.isActive).toBe(false);
    expect(sessionRepo.save).toHaveBeenCalledTimes(2);
    expect(authService.invalidateCache).toHaveBeenCalledWith('user-1', 'user');
  });

  it('publishes UserDeactivatedEvent', async () => {
    repo.findById.mockResolvedValue(makeActiveUser('user-1'));
    sessionRepo.findByUserId.mockResolvedValue([]);

    await useCase.execute({ userId: 'user-1' });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as UserDeactivatedEvent;
    expect(event).toBeInstanceOf(UserDeactivatedEvent);
    expect(event.eventName).toBe('user.deactivated');
    expect(event.userId).toBe('user-1');
  });

  it('returns USER_NOT_FOUND and does not publish event', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'ghost' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_NOT_FOUND');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns USER_ALREADY_INACTIVE and does not publish event', async () => {
    repo.findById.mockResolvedValue(
      User.reconstitute('u1', {
        email: 'u@t.com',
        passwordHash: 'h',
        role: 'member',
        isActive: false,
        xpTotal: 0,
        streakCount: 0,
        settings: {},
        createdAt: new Date(),
      }),
    );

    const result = await useCase.execute({ userId: 'u1' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_ALREADY_INACTIVE');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
