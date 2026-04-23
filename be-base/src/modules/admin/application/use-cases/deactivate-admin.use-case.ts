import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../../../core/auth/domain/repositories/session.repository';
import { AuthorizationService } from '../../../../core/authorization';

export interface DeactivateAdminInput {
  adminId: string;
  requesterId: string;
}

export type DeactivateAdminResult = Result<void, string>;

@Injectable()
export class DeactivateAdminUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(input: DeactivateAdminInput): Promise<DeactivateAdminResult> {
    if (input.adminId === input.requesterId) {
      return { ok: false, error: 'CANNOT_DEACTIVATE_SELF' };
    }

    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };
    if (!admin.isActive) return { ok: false, error: 'ADMIN_ALREADY_INACTIVE' };

    admin.deactivate();
    await this.adminRepo.save(admin);

    // Revoke all active sessions so existing tokens stop working immediately
    const sessions = await this.sessionRepo.findByUserId(input.adminId, true);
    await Promise.all(
      sessions.map((s) => {
        s.revoke();
        return this.sessionRepo.save(s);
      }),
    );

    // Invalidate permission cache so the deactivated admin loses access instantly
    this.authorizationService.invalidateCache(input.adminId, 'admin');

    return { ok: true, value: undefined };
  }
}
