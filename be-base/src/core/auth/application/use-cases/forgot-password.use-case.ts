import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../domain/repositories/password-reset-token.repository';
import type { IPasswordUpdater } from '../../domain/services/password-updater.interface';
import { PASSWORD_UPDATERS } from '../../domain/services/password-updater.interface';
import type { IMailerService } from '../../domain/services/mailer.interface';
import { MAILER_SERVICE } from '../../domain/services/mailer.interface';

export interface ForgotPasswordInput {
  email: string;
  type: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);
  private readonly updaters: IPasswordUpdater[];

  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepo: IPasswordResetTokenRepository,
    @Inject(MAILER_SERVICE)
    private readonly mailerService: IMailerService,
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

  async execute(input: ForgotPasswordInput): Promise<void> {
    const updater = this.updaters.find((u) => u.type === input.type);
    if (!updater) return;

    const found = await updater.findByEmail(input.email);
    if (!found || !found.isActive) return;

    const { entity, plainToken } = PasswordResetToken.generate(
      found.userId,
      input.type,
      input.email,
    );
    await this.tokenRepo.save(entity);

    const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${plainToken}`;

    try {
      await this.mailerService.sendPasswordResetEmail({
        to: input.email,
        resetLink,
      });
      this.logger.log(
        `Password reset email sent for ${input.type}:${input.email}`,
      );
    } catch (err) {
      this.logger.error(`Failed to send reset email for ${input.email}`, err);
    }
  }
}
