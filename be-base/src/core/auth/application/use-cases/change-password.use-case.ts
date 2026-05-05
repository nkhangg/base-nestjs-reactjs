import { Inject, Injectable, Optional } from '@nestjs/common';
import type { ITokenService } from '../../domain/services/token.service';
import { TOKEN_SERVICE } from '../../domain/services/token.service';
import type { IPasswordUpdater } from '../../domain/services/password-updater.interface';
import { PASSWORD_UPDATERS } from '../../domain/services/password-updater.interface';
import type { Result } from '../../../../shared/application/result';

export interface ChangePasswordInput {
  userId: string;
  userType: string;
  currentPassword: string;
  newPassword: string;
}

export type ChangePasswordError = 'user_not_found' | 'wrong_password';

@Injectable()
export class ChangePasswordUseCase {
  private readonly updaters: IPasswordUpdater[];

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    @Optional()
    @Inject(PASSWORD_UPDATERS)
    updaters: IPasswordUpdater | IPasswordUpdater[] = [],
  ) {
    this.updaters = Array.isArray(updaters)
      ? updaters
      : updaters
        ? [updaters]
        : [];
  }

  async execute(
    input: ChangePasswordInput,
  ): Promise<Result<void, ChangePasswordError>> {
    const updater = this.updaters.find((u) => u.type === input.userType);
    if (!updater) return { ok: false, error: 'user_not_found' };

    const currentHash = await updater.findHashById(input.userId);
    if (!currentHash) return { ok: false, error: 'user_not_found' };

    const valid = await this.tokenService.compareTokenHash(
      input.currentPassword,
      currentHash,
    );
    if (!valid) return { ok: false, error: 'wrong_password' };

    const newHash = await this.tokenService.hashToken(input.newPassword);
    await updater.updatePassword(input.userId, newHash);

    return { ok: true, value: undefined };
  }
}
