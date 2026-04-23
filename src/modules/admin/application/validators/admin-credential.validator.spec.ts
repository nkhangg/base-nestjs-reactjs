import { AdminCredentialValidator } from './admin-credential.validator';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { Admin } from '../../domain/entities/admin.entity';

const makeRepo = (): jest.Mocked<Pick<IAdminRepository, 'findByEmail'>> => ({
  findByEmail: jest.fn(),
});

const makeTokenService = (): jest.Mocked<
  Pick<ITokenService, 'compareTokenHash'>
> => ({
  compareTokenHash: jest.fn(),
});

const makeAdmin = (isActive = true) =>
  Admin.reconstitute('admin-id-1', {
    email: 'admin@test.com',
    passwordHash: 'hashed-secret',
    role: 'super-admin',
    isActive,
    createdAt: new Date(),
  });

describe('AdminCredentialValidator', () => {
  let validator: AdminCredentialValidator;
  let repo: jest.Mocked<Pick<IAdminRepository, 'findByEmail'>>;
  let tokenService: jest.Mocked<Pick<ITokenService, 'compareTokenHash'>>;

  beforeEach(() => {
    repo = makeRepo();
    tokenService = makeTokenService();
    validator = new AdminCredentialValidator(
      repo as unknown as IAdminRepository,
      tokenService as unknown as ITokenService,
    );
  });

  it('should have type "admin"', () => {
    expect(validator.type).toBe('admin');
  });

  it('should return null when admin not found', async () => {
    repo.findByEmail.mockResolvedValue(null);

    const result = await validator.validate('nobody@test.com', 'pass');
    expect(result).toBeNull();
  });

  it('should return null when admin is inactive', async () => {
    repo.findByEmail.mockResolvedValue(makeAdmin(false));

    const result = await validator.validate('admin@test.com', 'correct-pass');
    expect(result).toBeNull();
  });

  it('should return null when password is wrong', async () => {
    repo.findByEmail.mockResolvedValue(makeAdmin());
    tokenService.compareTokenHash.mockReturnValue(false);

    const result = await validator.validate('admin@test.com', 'wrong-pass');
    expect(result).toBeNull();
  });

  it('should return IAuthIdentity on valid credentials', async () => {
    const admin = makeAdmin();
    repo.findByEmail.mockResolvedValue(admin);
    tokenService.compareTokenHash.mockReturnValue(true);

    const result = await validator.validate('admin@test.com', 'correct-pass');

    expect(result).toEqual({
      id: 'admin-id-1',
      email: 'admin@test.com',
      type: 'admin',
      role: 'super-admin',
    });
  });

  it('should compare password against stored hash', async () => {
    const admin = makeAdmin();
    repo.findByEmail.mockResolvedValue(admin);
    tokenService.compareTokenHash.mockReturnValue(true);

    await validator.validate('admin@test.com', 'plain-pass');

    expect(tokenService.compareTokenHash).toHaveBeenCalledWith(
      'plain-pass',
      'hashed-secret',
    );
  });
});
