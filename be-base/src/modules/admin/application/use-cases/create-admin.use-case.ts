import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { Admin } from '../../domain/entities/admin.entity';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../domain/repositories/admin.repository';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { TOKEN_SERVICE } from '../../../../core/auth/domain/services/token.service';
import { AuthorizationService } from '../../../../core/authorization';

export interface CreateAdminInput {
  email: string;
  password: string;
  role?: string;
}

export type CreateAdminResult = Result<{ adminId: string }, string>;

@Injectable()
export class CreateAdminUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(input: CreateAdminInput): Promise<CreateAdminResult> {
    const existing = await this.adminRepo.findByEmail(input.email);
    if (existing) {
      return { ok: false, error: 'EMAIL_ALREADY_EXISTS' };
    }

    const passwordHash = this.tokenService.hashToken(input.password);
    const roleName = input.role ?? 'admin';
    const admin = Admin.create({
      email: input.email,
      passwordHash,
      role: roleName,
    });

    await this.adminRepo.save(admin);

    await this.authorizationService.assignRoleWithFallback(
      admin.id.value,
      'admin',
      roleName,
    );

    return { ok: true, value: { adminId: admin.id.value } };
  }
}
