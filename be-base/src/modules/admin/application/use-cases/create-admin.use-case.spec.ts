import { CreateAdminUseCase } from './create-admin.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import type { AuthorizationService } from '../../../../core/authorization';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { AdminCreatedEvent } from '../../domain/events/admin-created.event';
import { Admin } from '../../domain/entities/admin.entity';

const makeRepo = (): jest.Mocked<IAdminRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
});

const makeTokenService = (): jest.Mocked<Pick<ITokenService, 'hashToken'>> => ({
  hashToken: jest.fn().mockReturnValue('hashed-password'),
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

describe('CreateAdminUseCase', () => {
  let useCase: CreateAdminUseCase;
  let repo: jest.Mocked<IAdminRepository>;
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
    useCase = new CreateAdminUseCase(
      repo,
      tokenService as unknown as ITokenService,
      authService as unknown as AuthorizationService,
      eventBus,
    );
  });

  it('should create admin and return adminId on success', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    const result = await useCase.execute({
      email: 'new@test.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.adminId).toBeTruthy();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(authService.assignRoleWithFallback).toHaveBeenCalledTimes(1);
  });

  it('should publish AdminCreatedEvent after successful creation', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    const result = await useCase.execute({
      email: 'new@test.com',
      password: 'p',
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as AdminCreatedEvent;
    expect(event).toBeInstanceOf(AdminCreatedEvent);
    expect(event.eventName).toBe('admin.created');
    expect(event.email).toBe('new@test.com');
    if (result.ok) expect(event.adminId).toBe(result.value.adminId);
  });

  it('should NOT publish event when email is already taken', async () => {
    repo.findByEmail.mockResolvedValue(
      Admin.create({ email: 'taken@test.com', passwordHash: 'h' }),
    );

    await useCase.execute({ email: 'taken@test.com', password: 'p' });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should hash the password before saving', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    await useCase.execute({ email: 'new@test.com', password: 'plain' });

    expect(tokenService.hashToken).toHaveBeenCalledWith('plain');
    const savedAdmin: Admin = repo.save.mock.calls[0][0];
    expect(savedAdmin.passwordHash).toBe('hashed-password');
  });

  it('should return EMAIL_ALREADY_EXISTS when email is taken', async () => {
    repo.findByEmail.mockResolvedValue(
      Admin.create({ email: 'taken@test.com', passwordHash: 'h' }),
    );

    const result = await useCase.execute({
      email: 'taken@test.com',
      password: 'secret',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('EMAIL_ALREADY_EXISTS');
    expect(repo.save).not.toHaveBeenCalled();
    expect(authService.assignRoleWithFallback).not.toHaveBeenCalled();
  });

  it('should use default role "admin" when roles not specified', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    await useCase.execute({ email: 'new@test.com', password: 'p' });

    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      expect.any(String),
      'admin',
      'admin',
    );
  });

  it('should assign all specified roles', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    await useCase.execute({
      email: 'new@test.com',
      password: 'p',
      roles: ['super-admin', 'editor'],
    });

    expect(authService.assignRoleWithFallback).toHaveBeenCalledTimes(2);
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      expect.any(String),
      'admin',
      'super-admin',
    );
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      expect.any(String),
      'admin',
      'editor',
    );
  });
});
