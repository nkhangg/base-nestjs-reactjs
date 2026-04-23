import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { Session } from '../../../../core/auth/domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../../../core/auth/domain/repositories/session.repository';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';

export interface ListAdminSessionsInput {
  adminId: string;
  onlyActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListAdminSessionsOutput {
  data: Session[];
  total: number;
}

export type ListAdminSessionsResult = Result<ListAdminSessionsOutput, string>;

@Injectable()
export class ListAdminSessionsUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(
    input: ListAdminSessionsInput,
  ): Promise<ListAdminSessionsResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };

    const all = await this.sessionRepo.findByUserId(
      input.adminId,
      input.onlyActive,
    );

    const total = all.length;
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const data = all.slice(start, start + pageSize);

    return { ok: true, value: { data, total } };
  }
}
