import { ListAdminsUseCase } from './list-admins.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import { Admin } from '../../domain/entities/admin.entity';

const makeRepo = (): jest.Mocked<IAdminRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
});

const makeAdmin = (email: string, isActive = true) =>
  Admin.reconstitute(`id-${email}`, {
    email,
    passwordHash: 'hash',
    role: 'admin',
    isActive,
    createdAt: new Date(),
  });

describe('ListAdminsUseCase', () => {
  let useCase: ListAdminsUseCase;
  let repo: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ListAdminsUseCase(repo);
  });

  it('should return data and total when admins exist', async () => {
    const admins = [makeAdmin('a@test.com'), makeAdmin('b@test.com', false)];
    repo.findAll.mockResolvedValue({ data: admins, total: 2 });

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should forward all options to repository', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute({
      search: 'alice',
      isActive: true,
      role: 'editor',
      sortBy: 'email',
      sortDir: 'asc',
      page: 2,
      pageSize: 10,
    });

    expect(repo.findAll).toHaveBeenCalledWith({
      search: 'alice',
      isActive: true,
      role: 'editor',
      sortBy: 'email',
      sortDir: 'asc',
      page: 2,
      pageSize: 10,
    });
  });

  it('should return empty data and zero total when no admins', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should use default empty input when called with no args', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await useCase.execute();

    expect(repo.findAll).toHaveBeenCalledWith({});
  });
});
