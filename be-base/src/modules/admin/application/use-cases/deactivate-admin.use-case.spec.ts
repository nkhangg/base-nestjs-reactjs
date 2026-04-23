import { DeactivateAdminUseCase } from './deactivate-admin.use-case';
import type { IAdminRepository } from '../../domain/repositories/admin.repository';
import type { SessionRepository } from '../../../../core/auth/domain/repositories/session.repository';
import type { AuthorizationService } from '../../../../core/authorization';
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

const makeAuthService = (): jest.Mocked<
  Pick<AuthorizationService, 'invalidateCache'>
> => ({
  invalidateCache: jest.fn(),
});

const makeAdmin = (id = 'admin-1', isActive = true) =>
  Admin.reconstitute(id, {
    email: `${id}@test.com`,
    passwordHash: 'hash',
    role: 'admin',
    isActive,
    createdAt: new Date(),
  });

const makeSession = (id: string, userId: string) =>
  Session.reconstitute(id, {
    userId,
    refreshTokenHash: 'hash',
    deviceInfo: DeviceInfo.create({
      deviceName: 'Chrome',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    }),
    isActive: true,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 86400_000),
    createdAt: new Date(),
  });

describe('DeactivateAdminUseCase', () => {
  let useCase: DeactivateAdminUseCase;
  let adminRepo: jest.Mocked<IAdminRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let authService: jest.Mocked<Pick<AuthorizationService, 'invalidateCache'>>;

  beforeEach(() => {
    adminRepo = makeAdminRepo();
    sessionRepo = makeSessionRepo();
    authService = makeAuthService();
    useCase = new DeactivateAdminUseCase(
      adminRepo,
      sessionRepo,
      authService as unknown as AuthorizationService,
    );
  });

  it('should deactivate admin, save, and revoke all active sessions', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    adminRepo.save.mockResolvedValue();
    sessionRepo.findByUserId.mockResolvedValue([
      makeSession('s1', 'admin-1'),
      makeSession('s2', 'admin-1'),
    ]);
    sessionRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      adminId: 'admin-1',
      requesterId: 'requester-99',
    });

    expect(result.ok).toBe(true);
    const savedAdmin: Admin = adminRepo.save.mock.calls[0][0];
    expect(savedAdmin.isActive).toBe(false);
    expect(sessionRepo.findByUserId).toHaveBeenCalledWith('admin-1', true);
    expect(sessionRepo.save).toHaveBeenCalledTimes(2);
    const [s1, s2] = sessionRepo.save.mock.calls.map(([s]: [Session]) => s);
    expect(s1.isActive).toBe(false);
    expect(s2.isActive).toBe(false);
    expect(authService.invalidateCache).toHaveBeenCalledWith(
      'admin-1',
      'admin',
    );
  });

  it('should return CANNOT_DEACTIVATE_SELF when adminId equals requesterId', async () => {
    const result = await useCase.execute({
      adminId: 'same-id',
      requesterId: 'same-id',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CANNOT_DEACTIVATE_SELF');
    expect(adminRepo.findById).not.toHaveBeenCalled();
    expect(adminRepo.save).not.toHaveBeenCalled();
  });

  it('should return ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      adminId: 'ghost',
      requesterId: 'requester-99',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
    expect(adminRepo.save).not.toHaveBeenCalled();
    expect(sessionRepo.findByUserId).not.toHaveBeenCalled();
  });

  it('should return ADMIN_ALREADY_INACTIVE when already deactivated', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1', false));

    const result = await useCase.execute({
      adminId: 'admin-1',
      requesterId: 'requester-99',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_ALREADY_INACTIVE');
    expect(adminRepo.save).not.toHaveBeenCalled();
    expect(sessionRepo.findByUserId).not.toHaveBeenCalled();
  });
});
