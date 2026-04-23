import { Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { AuthorizationService } from '../../../../core/authorization';
import type { SubjectType, Action } from '../../../../core/authorization';

export interface CreateRoleInput {
  name: string;
  subjectType: SubjectType;
  description?: string;
  parentId?: string;
  permissions: Record<string, Action[]>;
}

export type CreateRoleResult = Result<
  { roleId: string },
  'ROLE_ALREADY_EXISTS' | 'PARENT_NOT_FOUND'
>;

@Injectable()
export class CreateRoleUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(input: CreateRoleInput): Promise<CreateRoleResult> {
    try {
      const role = await this.authorizationService.createRole(input);
      return { ok: true, value: { roleId: role.id } };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already exists'))
        return { ok: false, error: 'ROLE_ALREADY_EXISTS' };
      if (msg.includes('Parent role'))
        return { ok: false, error: 'PARENT_NOT_FOUND' };
      throw err;
    }
  }
}
