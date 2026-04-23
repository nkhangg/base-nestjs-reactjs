import { Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { AuthorizationService } from '../../../../core/authorization';
import type { Role } from '../../../../core/authorization/domain/entities/role.entity';
import type { Permission } from '../../../../core/authorization/domain/entities/permission.entity';

export type GetRoleResult = Result<
  { role: Role; permissions: Permission[] },
  'ROLE_NOT_FOUND'
>;

@Injectable()
export class GetRoleUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(roleId: string): Promise<GetRoleResult> {
    const result =
      await this.authorizationService.getRoleWithPermissions(roleId);
    if (!result) return { ok: false, error: 'ROLE_NOT_FOUND' };
    return { ok: true, value: result };
  }
}
