import { RevokeAdminSessionUseCase } from './revoke-admin-session.use-case';
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
      deviceName: 'Chrome',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    }),
    isActive,
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 86400_000),
    createdAt: new Date(),
  });

describe('RevokeAdminSessionUseCase', () => {
  let useCase: RevokeAdminSessionUseCase;
  let adminRepo: jest.Mocked<IAdminRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    adminRepo = makeAdminRepo();
    sessionRepo = makeSessionRepo();
    useCase = new RevokeAdminSessionUseCase(adminRepo, sessionRepo);
  });

  it('should revoke session and save', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findById.mockResolvedValue(makeSession('s1', 'admin-1'));
    sessionRepo.save.mockResolvedValue();

    const result = await useCase.execute({
      adminId: 'admin-1',
      sessionId: 's1',
    });

    expect(result.ok).toBe(true);
    expect(sessionRepo.save).toHaveBeenCalledTimes(1);
    const saved: Session = sessionRepo.save.mock.calls[0][0];
    expect(saved.isActive).toBe(false);
  });

  it('should return ADMIN_NOT_FOUND when admin does not exist', async () => {
    adminRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ adminId: 'ghost', sessionId: 's1' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('ADMIN_NOT_FOUND');
    expect(sessionRepo.findById).not.toHaveBeenCalled();
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('should return SESSION_NOT_FOUND when session does not exist', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      adminId: 'admin-1',
      sessionId: 'ghost-session',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('SESSION_NOT_FOUND');
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('should return SESSION_NOT_OWNED when session belongs to another admin', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findById.mockResolvedValue(makeSession('s1', 'other-admin'));

    const result = await useCase.execute({
      adminId: 'admin-1',
      sessionId: 's1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('SESSION_NOT_OWNED');
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('should return SESSION_ALREADY_REVOKED when session is inactive', async () => {
    adminRepo.findById.mockResolvedValue(makeAdmin('admin-1'));
    sessionRepo.findById.mockResolvedValue(makeSession('s1', 'admin-1', false));

    const result = await useCase.execute({
      adminId: 'admin-1',
      sessionId: 's1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('SESSION_ALREADY_REVOKED');
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });
});
