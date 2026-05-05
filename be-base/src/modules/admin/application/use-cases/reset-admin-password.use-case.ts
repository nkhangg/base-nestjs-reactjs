import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { TOKEN_SERVICE } from '../../../../core/auth/domain/services/token.service';

export interface ResetAdminPasswordInput {
  adminId: string;
  newPassword: string;
}

export type ResetAdminPasswordResult = Result<void, string>;

@Injectable()
export class ResetAdminPasswordUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(input: ResetAdminPasswordInput): Promise<ResetAdminPasswordResult> {
    const admin = await this.adminRepo.findById(input.adminId);
    if (!admin) return { ok: false, error: 'ADMIN_NOT_FOUND' };

    const newHash = this.tokenService.hashToken(input.newPassword);
    admin.updatePassword(newHash);
    await this.adminRepo.save(admin);

    return { ok: true, value: undefined };
  }
}
