import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import { AuthorizationService } from '../../../../core/authorization';

export interface SyncAdminRolesInput {
  adminId: string;
  roles: string[];
}

export type SyncAdminRolesResult = Result<void, string>;

@Injectable()
export class SyncAdminRolesUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(input: SyncAdminRolesInput): Promise<SyncAdminRolesResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };
    if (!admin.isActive) return { ok: false, error: 'ADMIN_INACTIVE' };

    const current = await this.authorizationService.getAssignedRoleNames(
      input.adminId,
      'admin',
    );

    const toRevoke = current.filter((r) => !input.roles.includes(r));
    const toAssign = input.roles.filter((r) => !current.includes(r));

    await Promise.all([
      ...toRevoke.map((r) =>
        this.authorizationService.revokeRole(input.adminId, 'admin', r),
      ),
      ...toAssign.map((r) =>
        this.authorizationService.assignRoleWithFallback(
          input.adminId,
          'admin',
          r,
        ),
      ),
    ]);

    return { ok: true, value: undefined };
  }
}
