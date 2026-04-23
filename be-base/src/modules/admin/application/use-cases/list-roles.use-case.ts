import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '../../../../core/authorization';
import type { SubjectType } from '../../../../core/authorization';
import type { Role } from '../../../../core/authorization/domain/entities/role.entity';

export interface ListRolesOptions {
  subjectType?: SubjectType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListRolesResult {
  data: Role[];
  total: number;
}

@Injectable()
export class ListRolesUseCase {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async execute(options?: ListRolesOptions): Promise<ListRolesResult> {
    return this.authorizationService.listRoles(options);
  }
}
