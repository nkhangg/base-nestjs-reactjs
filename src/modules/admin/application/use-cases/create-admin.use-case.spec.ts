import { CreateAdminUseCase } from './create-admin.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import type { AuthorizationService } from '../../../../core/authorization';
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

describe('CreateAdminUseCase', () => {
  let useCase: CreateAdminUseCase;
  let repo: jest.Mocked<IAdminRepository>;
  let tokenService: jest.Mocked<Pick<ITokenService, 'hashToken'>>;
  let authService: jest.Mocked<
    Pick<AuthorizationService, 'assignRoleWithFallback'>
  >;

  beforeEach(() => {
    repo = makeRepo();
    tokenService = makeTokenService();
    authService = makeAuthService();
    useCase = new CreateAdminUseCase(
      repo,
      tokenService as unknown as ITokenService,
      authService as unknown as AuthorizationService,
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

  it('should use default role "admin" when not specified', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    await useCase.execute({ email: 'new@test.com', password: 'p' });

    const savedAdmin: Admin = repo.save.mock.calls[0][0];
    expect(savedAdmin.role).toBe('admin');
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      expect.any(String),
      'admin',
      'admin',
    );
  });

  it('should use custom role when specified', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.save.mockResolvedValue();

    await useCase.execute({
      email: 'new@test.com',
      password: 'p',
      role: 'super-admin',
    });

    const savedAdmin: Admin = repo.save.mock.calls[0][0];
    expect(savedAdmin.role).toBe('super-admin');
    expect(authService.assignRoleWithFallback).toHaveBeenCalledWith(
      expect.any(String),
      'admin',
      'super-admin',
    );
  });
});
