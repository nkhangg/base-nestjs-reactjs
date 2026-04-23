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

export interface RevokeAdminSessionInput {
  adminId: string;
  sessionId: string;
}

export type RevokeAdminSessionResult = Result<void, string>;

@Injectable()
export class RevokeAdminSessionUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(
    input: RevokeAdminSessionInput,
  ): Promise<RevokeAdminSessionResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };

    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) return { ok: false, error: 'SESSION_NOT_FOUND' };

    // Ensure the session belongs to this admin
    if (session.userId !== input.adminId) {
      return { ok: false, error: 'SESSION_NOT_OWNED' };
    }

    if (!session.isActive) {
      return { ok: false, error: 'SESSION_ALREADY_REVOKED' };
    }

    session.revoke();
    await this.sessionRepo.save(session);

    return { ok: true, value: undefined };
  }
}
