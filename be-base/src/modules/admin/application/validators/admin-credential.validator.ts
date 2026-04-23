import { Inject, Injectable } from '@nestjs/common';
import type { ICredentialValidator } from '../../../../core/auth/domain/services/credential-validator.interface';
import type { IAuthIdentity } from '../../../../core/auth/domain/services/auth-identity.interface';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { TOKEN_SERVICE } from '../../../../core/auth/domain/services/token.service';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../../admin/domain/repositories/admin.repository';

@Injectable()
export class AdminCredentialValidator implements ICredentialValidator {
  readonly type = 'admin';

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async validate(
    email: string,
    password: string,
  ): Promise<IAuthIdentity | null> {
    const admin = await this.adminRepo.findByEmail(email);
    if (!admin || !admin.isActive) return null;

    const valid = this.tokenService.compareTokenHash(
      password,
      admin.passwordHash,
    );
    if (!valid) return null;

    return {
      id: admin.id.value,
      email: admin.email,
      type: 'admin',
      role: admin.role,
    };
  }
}
