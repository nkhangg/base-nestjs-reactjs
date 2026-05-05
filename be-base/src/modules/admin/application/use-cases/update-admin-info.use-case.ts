import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';

export interface UpdateAdminInfoInput {
  adminId: string;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export type UpdateAdminInfoResult = Result<void, string>;

@Injectable()
export class UpdateAdminInfoUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(input: UpdateAdminInfoInput): Promise<UpdateAdminInfoResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };

    admin.updateProfile({
      name: input.name,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
    });
    await this.adminRepo.save(admin);

    return { ok: true, value: undefined };
  }
}
