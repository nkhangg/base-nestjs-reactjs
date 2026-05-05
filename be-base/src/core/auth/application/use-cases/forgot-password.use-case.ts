import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/repositories/password-reset-token.repository';
import type { IPasswordUpdater } from '../../domain/services/password-updater.interface';
import { PASSWORD_UPDATERS } from '../../domain/services/password-updater.interface';

export interface ForgotPasswordInput {
  email: string;
  type: string;
}

export interface ForgotPasswordOutput {
  /**
   * Plain reset token.
   * TODO: remove from response and send via email once a mailer module is available.
   */
  token: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);
  private readonly updaters: IPasswordUpdater[];

  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepo: IPasswordResetTokenRepository,
    @Optional() @Inject(PASSWORD_UPDATERS) updaters: IPasswordUpdater | IPasswordUpdater[] = [],
  ) {
    this.updaters = Array.isArray(updaters) ? updaters : updaters ? [updaters] : [];
  }

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordOutput> {
    const updater = this.updaters.find((u) => u.type === input.type);
    if (!updater) return { token: '' };

    const found = await updater.findByEmail(input.email);
    if (!found || !found.isActive) return { token: '' };

    const { entity, plainToken } = PasswordResetToken.generate(
      found.userId,
      input.type,
    );
    await this.tokenRepo.save(entity);

    // TODO: emit PasswordResetRequestedEvent once mailer module is available
    this.logger.log(
      `Password reset token generated for ${input.type}:${input.email}`,
    );

    return { token: plainToken };
  }
}
