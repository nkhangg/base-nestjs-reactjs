import { UpdateUserInfoUseCase } from './update-user-info.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { UserEmailChangedEvent } from '../../domain/events/user-email-changed.event';
import { User } from '../../domain/entities/user.entity';

const makeRepo = (): jest.Mocked<IUserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  findByOAuthProvider: jest.fn(),
  saveOAuthAccount: jest.fn().mockResolvedValue(undefined),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeUser = (id = 'user-1', email = 'old@test.com') =>
  User.reconstitute(id, {
    email,
    passwordHash: 'hash',
    role: 'member',
    isActive: true,
    xpTotal: 0,
    streakCount: 0,
    settings: {},
    createdAt: new Date(),
  });

describe('UpdateUserInfoUseCase', () => {
  let useCase: UpdateUserInfoUseCase;
  let repo: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    eventBus = makeEventBus();
    useCase = new UpdateUserInfoUseCase(repo, eventBus);
  });

  it('saves user with updated email', async () => {
    repo.findById.mockResolvedValue(makeUser('user-1', 'old@test.com'));
    repo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-1',
      email: 'new@test.com',
    });

    expect(result.ok).toBe(true);
    const saved: User = repo.save.mock.calls[0][0];
    expect(saved.email).toBe('new@test.com');
  });

  it('publishes UserEmailChangedEvent when email changes', async () => {
    repo.findById.mockResolvedValue(makeUser('user-1', 'old@test.com'));
    repo.findByEmail.mockResolvedValue(null);

    await useCase.execute({ userId: 'user-1', email: 'new@test.com' });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as UserEmailChangedEvent;
    expect(event).toBeInstanceOf(UserEmailChangedEvent);
    expect(event.eventName).toBe('user.email_changed');
    expect(event.userId).toBe('user-1');
    expect(event.oldEmail).toBe('old@test.com');
    expect(event.newEmail).toBe('new@test.com');
  });

  it('does NOT publish event when email is the same', async () => {
    repo.findById.mockResolvedValue(makeUser('user-1', 'same@test.com'));

    await useCase.execute({ userId: 'user-1', email: 'same@test.com' });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('does NOT publish event when no email field provided', async () => {
    repo.findById.mockResolvedValue(makeUser('user-1', 'old@test.com'));

    await useCase.execute({ userId: 'user-1' });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns USER_NOT_FOUND and does not publish event', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'ghost',
      email: 'new@test.com',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('USER_NOT_FOUND');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns EMAIL_ALREADY_EXISTS and does not publish event', async () => {
    repo.findById.mockResolvedValue(makeUser('user-1', 'old@test.com'));
    repo.findByEmail.mockResolvedValue(makeUser('user-2', 'taken@test.com'));

    const result = await useCase.execute({
      userId: 'user-1',
      email: 'taken@test.com',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EMAIL_ALREADY_EXISTS');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
