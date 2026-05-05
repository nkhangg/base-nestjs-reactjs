import { Inject, Injectable, Optional } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/repositories/password-reset-token.repository';
import type { IPasswordUpdater } from '../../domain/services/password-updater.interface';
import { PASSWORD_UPDATERS } from '../../domain/services/password-updater.interface';
import type { ITokenService } from '../../domain/services/token.service';
import { TOKEN_SERVICE } from '../../domain/services/token.service';
import type { Result } from '../../../../shared/application/result';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export type ResetPasswordError = 'token_invalid' | 'token_expired' | 'user_not_found';

@Injectable()
export class ResetPasswordUseCase {
  private readonly updaters: IPasswordUpdater[];

  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepo: IPasswordResetTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    @Optional() @Inject(PASSWORD_UPDATERS) updaters: IPasswordUpdater | IPasswordUpdater[] = [],
  ) {
    this.updaters = Array.isArray(updaters) ? updaters : updaters ? [updaters] : [];
  }

  async execute(
    input: ResetPasswordInput,
  ): Promise<Result<void, ResetPasswordError>> {
    const tokenHash = PasswordResetToken.hashToken(input.token);
    const tokenEntity = await this.tokenRepo.findByTokenHash(tokenHash);

    if (!tokenEntity) return { ok: false, error: 'token_invalid' };
    if (tokenEntity.isExpired) return { ok: false, error: 'token_expired' };
    if (tokenEntity.isUsed) return { ok: false, error: 'token_invalid' };

    const updater = this.updaters.find((u) => u.type === tokenEntity.userType);
    if (!updater) return { ok: false, error: 'user_not_found' };

    const newHash = await this.tokenService.hashToken(input.newPassword);
    await updater.updatePassword(tokenEntity.userId, newHash);

    await this.tokenRepo.save(tokenEntity.markUsed());

    return { ok: true, value: undefined };
  }
}
