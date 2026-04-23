import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import { AuthorizationService } from '../../../../core/authorization';

export interface UpdateAdminRoleInput {
  adminId: string;
  role: string;
}

export type UpdateAdminRoleResult = Result<void, string>;

@Injectable()
export class UpdateAdminRoleUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(input: UpdateAdminRoleInput): Promise<UpdateAdminRoleResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };
    if (!admin.isActive) return { ok: false, error: 'ADMIN_INACTIVE' };

    const oldRole = admin.role;
    admin.updateRole(input.role);
    await this.adminRepo.save(admin);

    await this.authorizationService.revokeRole(input.adminId, 'admin', oldRole);
    await this.authorizationService.assignRoleWithFallback(
      input.adminId,
      'admin',
      input.role,
    );

    return { ok: true, value: undefined };
  }
}
