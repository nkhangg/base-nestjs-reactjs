import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../../../core/auth/domain/repositories/session.repository';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';

export type AuthEventType = 'LOGIN' | 'LOGOUT' | 'EXPIRED';

export interface AuthLogEntry {
  sessionId: string;
  event: AuthEventType;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

export interface GetAdminAuthLogsInput {
  adminId: string;
  page?: number;
  pageSize?: number;
}

export interface GetAdminAuthLogsOutput {
  data: AuthLogEntry[];
  total: number;
}

export type GetAdminAuthLogsResult = Result<GetAdminAuthLogsOutput, string>;

function resolveEvent(isActive: boolean, expiresAt: Date): AuthEventType {
  if (!isActive) return 'LOGOUT';
  if (new Date() > expiresAt) return 'EXPIRED';
  return 'LOGIN';
}

@Injectable()
export class GetAdminAuthLogsUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(input: GetAdminAuthLogsInput): Promise<GetAdminAuthLogsResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };

    const sessions = await this.sessionRepo.findByUserId(input.adminId);

    // Sort newest login first
    const sorted = [...sessions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const logs: AuthLogEntry[] = sorted.map((s) => ({
      sessionId: s.id,
      event: resolveEvent(s.isActive, s.expiresAt),
      deviceName: s.deviceInfo.deviceName,
      ipAddress: s.deviceInfo.ipAddress,
      userAgent: s.deviceInfo.userAgent,
      loginAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
    }));

    const total = logs.length;
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const data = logs.slice(start, start + pageSize);

    return { ok: true, value: { data, total } };
  }
}
