import { Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { AuthorizationService } from '../../../../core/authorization';
import type { Action } from '../../../../core/authorization';

export interface UpdateRoleInput {
  roleId: string;
  description?: string;
  parentId?: string | null;
  permissions?: Record<string, Action[]>;
}

export type UpdateRoleResult = Result<
  void,
  'ROLE_NOT_FOUND' | 'PARENT_NOT_FOUND' | 'CIRCULAR_HIERARCHY'
>;

@Injectable()
export class UpdateRoleUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(input: UpdateRoleInput): Promise<UpdateRoleResult> {
    try {
      await this.authorizationService.updateRole(input.roleId, {
        description: input.description,
        parentId: input.parentId,
        permissions: input.permissions,
      });
      return { ok: true, value: undefined };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not found'))
        return { ok: false, error: 'ROLE_NOT_FOUND' };
      if (msg.includes('Parent role'))
        return { ok: false, error: 'PARENT_NOT_FOUND' };
      if (msg.includes('circular'))
        return { ok: false, error: 'CIRCULAR_HIERARCHY' };
      throw err;
    }
  }
}
