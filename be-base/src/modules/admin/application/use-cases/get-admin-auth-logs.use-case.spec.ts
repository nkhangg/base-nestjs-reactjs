import { GetAdminAuthLogsUseCase } from './get-admin-auth-logs.use-case';
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

const makeSession = (
  id: string,
  userId: string,
  opts: { isActive?: boolean; expiresAt?: Date; createdAt?: Date } = {},
) =>
  Session.reconstitute(id, {
    userId,
    refreshTokenHash: 'hash',
    deviceInfo: DeviceInfo.create({
      deviceName: 'Chrome / Windows',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    }),
    isActive: opts.isActive ?? true,
    lastActiveAt: new Date(),
    expiresAt: opts.expiresAt ?? new Date(Date.now() + 86400_000),
    createdAt: opts.createdAt ?? new Date(),
  });

describe('GetAdminAuthLogsUseCase', () => {
  let useCase: GetAdminAuthLogsUseCase;
  let adminRepo: jest.Mocked<IAdminRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    adminRepo = makeAdminRepo();
    sessionRepo = makeSessionRepo();
    useCase = new GetAdminAuthLogsUseCase(adminRepo, sessionRepo);
  });

  it('should return ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ adminId: 'ghost' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
  });

  it('should map active non-expired session to LOGIN event', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin());
    sessionRepo.findByUserId.mockResolvedValue([
      makeSession('s1', 'admin-1', {
        isActive: true,
        expiresAt: new Date(Date.now() + 86400_000),
      }),
    ]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data[0].event).toBe('LOGIN');
      expect(result.value.data[0].sessionId).toBe('s1');
    }
  });

  it('should map inactive session to LOGOUT event', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin());
    sessionRepo.findByUserId.mockResolvedValue([
      makeSession('s1', 'admin-1', { isActive: false }),
    ]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.data[0].event).toBe('LOGOUT');
  });

  it('should map active but expired session to EXPIRED event', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin());
    sessionRepo.findByUserId.mockResolvedValue([
      makeSession('s1', 'admin-1', {
        isActive: true,
        expiresAt: new Date(Date.now() - 1000),
      }),
    ]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.data[0].event).toBe('EXPIRED');
  });

  it('should sort logs newest first', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin());
    const older = makeSession('s-old', 'admin-1', {
      createdAt: new Date('2024-01-01'),
    });
    const newer = makeSession('s-new', 'admin-1', {
      createdAt: new Date('2024-06-01'),
    });
    sessionRepo.findByUserId.mockResolvedValue([older, newer]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data[0].sessionId).toBe('s-new');
      expect(result.value.data[1].sessionId).toBe('s-old');
    }
  });

  it('should paginate logs', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin());
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession(`s${i + 1}`, 'admin-1', {
        createdAt: new Date(Date.now() - i * 1000),
      }),
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
      expect(result.value.total).toBe(6);
    }
  });

  it('should include device info in each log entry', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin());
    sessionRepo.findByUserId.mockResolvedValue([makeSession('s1', 'admin-1')]);

    const result = await useCase.execute({ adminId: 'admin-1' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const entry = result.value.data[0];
      expect(entry.deviceName).toBe('Chrome / Windows');
      expect(entry.ipAddress).toBe('192.168.1.1');
    }
  });
});
