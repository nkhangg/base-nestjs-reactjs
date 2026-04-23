import { GetAdminUseCase } from './get-admin.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import { Admin } from '../../domain/entities/admin.entity';

const makeRepo = (): jest.Mocked<IAdminRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
});

const makeAdmin = (id = 'admin-1') =>
  Admin.reconstitute(id, {
    email: 'admin@test.com',
    passwordHash: 'hash',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
  });

describe('GetAdminUseCase', () => {
  let useCase: GetAdminUseCase;
  let repo: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new GetAdminUseCase(repo);
  });

  it('should return admin when found', async () => {
    const admin = makeAdmin('admin-1');
    repo.findById.mockResolvedValue(admin);

    const result = await useCase.execute('admin-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id.value).toBe('admin-1');
      expect(result.value.email).toBe('admin@test.com');
    }
  });

  it('should return ADMIN_NOT_FOUND when not found', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute('unknown-id');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
  });

  it('should query by the provided id', async () => {
    repo.findById.mockResolvedValue(makeAdmin('abc'));

    await useCase.execute('abc');

    expect(repo.findById).toHaveBeenCalledWith('abc');
  });
});
