import { CreateUserUseCase } from './create-user.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import type { AuthorizationService } from '../../../../core/authorization';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { User } from '../../domain/entities/user.entity';

const makeRepo = (): jest.Mocked<IUserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  findByOAuthProvider: jest.fn(),
  saveOAuthAccount: jest.fn().mockResolvedValue(undefined),
});

const makeTokenService = (): jest.Mocked<Pick<ITokenService, 'hashToken'>> => ({
  hashToken: jest.fn().mockReturnValue('hashed'),
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

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repo: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<Pick<ITokenService, 'hashToken'>>;
  let authService: jest.Mocked<
    Pick<AuthorizationService, 'assignRoleWithFallback'>
  >;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    tokenService = makeTokenService();
    authService = makeAuthService();
    eventBus = makeEventBus();
    useCase = new CreateUserUseCase(
      repo,
      tokenService as unknown as ITokenService,
      authService as unknown as AuthorizationService,
      eventBus,
    );
  });

  it('creates user and returns userId', async () => {
    repo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'user@test.com',
      password: 'pass',
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.userId).toBeTruthy();
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved: User = repo.save.mock.calls[0][0];
    expect(saved.email).toBe('user@test.com');
  });

  it('hashes password before saving', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ email: 'u@test.com', password: 'plain' });

    expect(tokenService.hashToken).toHaveBeenCalledWith('plain');
    const saved: User = repo.save.mock.calls[0][0];
    expect(saved.passwordHash).toBe('hashed');
  });

  it('assigns role with fallback to "member"', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await useCase.execute({
      email: 'u@test.com',
      password: 'p',
      role: 'premium',
    });

    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      expect.any(String),
      'user',
      'premium',
      'member',
    );
  });

  it('returns EMAIL_ALREADY_EXISTS when email is taken', async () => {
    repo.findByEmail.mockResolvedValue(
      User.create({ email: 'taken@test.com', passwordHash: 'h' }),
    );

    const result = await useCase.execute({
      email: 'taken@test.com',
      password: 'p',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EMAIL_ALREADY_EXISTS');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('publishes UserCreatedEvent with correct payload', async () => {
    repo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      email: 'new@test.com',
      password: 'p',
      role: 'premium',
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as UserCreatedEvent;
    expect(event).toBeInstanceOf(UserCreatedEvent);
    expect(event.eventName).toBe('user.created');
    expect(event.email).toBe('new@test.com');
    expect(event.role).toBe('premium');
    if (result.ok) expect(event.userId).toBe(result.value.userId);
  });

  it('uses default role "member" in event when role not specified', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ email: 'u@test.com', password: 'p' });

    const event = eventBus.publish.mock.calls[0][0] as UserCreatedEvent;
    expect(event.role).toBe('member');
  });

  it('does NOT publish event when email is already taken', async () => {
    repo.findByEmail.mockResolvedValue(
      User.create({ email: 'x@test.com', passwordHash: 'h' }),
    );

    await useCase.execute({ email: 'x@test.com', password: 'p' });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
