import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { Admin } from '../../domain/entities/admin.entity';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';

export type GetAdminResult = Result<Admin, string>;

@Injectable()
export class GetAdminUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(id: string): Promise<GetAdminResult> {
    const admin = await this.adminRepo.findById(id);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };
    return { ok: true, value: admin };
  }
}
