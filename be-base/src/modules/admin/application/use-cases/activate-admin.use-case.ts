import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';

export type ActivateAdminResult = Result<void, string>;

@Injectable()
export class ActivateAdminUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(adminId: string): Promise<ActivateAdminResult> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };
    if (admin.isActive) return { ok: false, error: 'ADMIN_ALREADY_ACTIVE' };

    admin.activate();
    await this.adminRepo.save(admin);

    return { ok: true, value: undefined };
  }
}
