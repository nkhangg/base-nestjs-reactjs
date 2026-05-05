import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import { AuthorizationService } from '../../../../core/authorization';

export type GetAdminRolesResult = Result<string[], string>;

@Injectable()
export class GetAdminRolesUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(adminId: string): Promise<GetAdminRolesResult> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };

    const roles = await this.authorizationService.getAssignedRoleNames(
      adminId,
      'admin',
    );
    return { ok: true, value: roles };
  }
}
