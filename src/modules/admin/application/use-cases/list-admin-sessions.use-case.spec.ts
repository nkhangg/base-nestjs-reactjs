import { ListAdminSessionsUseCase } from './list-admin-sessions.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { SessionRepository } from '../../../../core/auth/domain/repositories/session.repository';
import { Admin } from '../../domain/entities/admin.entity';
import { Session } from '../../../../core/auth/domain/entities/session.entity';
import { DeviceInfo } from '../../../../core/auth/domain/value-objects/device-info.vo';

const makeAdminRepo = (): jest.Mocked<IAdminRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
});

const makeSessionRepo = (): jest.Mocked<SessionRepository> => ({
  findById: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
});

const makeAdmin = (id = 'admin-1') =>
  Admin.reconstitute(id, {
    email: `${id}@test.com`,
    passwordHash: 'hash',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
  });

const makeSession = (id: string, userId: string, isActive = true) =>
  Session.reconstitute(id, {
    userId,
    refreshTokenHash: 'hash',
    deviceInfo: DeviceInfo.create({
      deviceName: 'Chrome / Windows',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    }),
    isActive,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 86400_000),
    createdAt: new Date(),
  });

describe('ListAdminSessionsUseCase', () => {
  let useCase: ListAdminSessionsUseCase;
  let adminRepo: jest.Mocked<IAdminRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    adminRepo = makeAdminRepo();
    sessionRepo = makeSessionRepo();
    useCase = new ListAdminSessionsUseCase(adminRepo, sessionRepo);
  });

  it('should return sessions and total for existing admin', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findByUserId.mockResolvedValue([
      makeSession('s1', 'admin-1'),
      makeSession('s2', 'admin-1'),
    ]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toHaveLength(2);
      expect(result.value.total).toBe(2);
    }
  });

  it('should return ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ adminId: 'ghost' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
    expect(sessionRepo.findByUserId).not.toHaveBeenCalled();
  });

  it('should pass onlyActive filter to repository', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findByUserId.mockResolvedValue([makeSession('s1', 'admin-1')]);

    await useCase.execute({ adminId: 'admin-1', onlyActive: true });

    expect(sessionRepo.findByUserId).toHaveBeenCalledWith('admin-1', true);
  });

  it('should paginate results', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession(`s${i + 1}`, 'admin-1'),
    );
    sessionRepo.findByUserId.mockResolvedValue(sessions);

    const result = await useCase.execute({
      adminId: 'admin-1',
      page: 2,
      pageSize: 2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toHaveLength(2);
      expect(result.value.total).toBe(5);
    }
  });

  it('should return empty when admin has no sessions', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toHaveLength(0);
      expect(result.value.total).toBe(0);
    }
  });
});
