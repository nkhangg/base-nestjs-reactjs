import { Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { AuthorizationService } from '../../../../core/authorization';

export type DeleteRoleResult = Result<void, 'ROLE_NOT_FOUND'>;

@Injectable()
export class DeleteRoleUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(roleId: string): Promise<DeleteRoleResult> {
    try {
      await this.authorizationService.deleteRole(roleId);
      return { ok: true, value: undefined };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not found'))
        return { ok: false, error: 'ROLE_NOT_FOUND' };
      throw err;
    }
  }
}
