import { Inject, Injectable } from '@nestjs/common';
import { UseCase, Result } from '../../../../shared/application';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../../domain/services/token.service';

export interface RefreshTokenInput {
  sessionId: string;
  refreshToken: string;
  expiredAccessToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase implements UseCase<
  RefreshTokenInput,
  Result<RefreshTokenOutput>
> {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<Result<RefreshTokenOutput>> {
    const session = await this.sessionRepo.findById(input.sessionId);

    if (!session) return Result.fail(new Error('Session not found'));
    if (!session.isValid())
      return Result.fail(new Error('Session expired or revoked'));

    const tokenValid = this.tokenService.compareTokenHash(
      input.refreshToken,
      session.refreshTokenHash,
    );
    if (!tokenValid) return Result.fail(new Error('Invalid refresh token'));

    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newHash = this.tokenService.hashToken(newRefreshToken);
    session.rotateRefreshToken(
      newHash,
      this.tokenService.getRefreshTokenExpiresAt(),
    );
    await this.sessionRepo.save(session);

    const oldPayload = this.tokenService.decodeAccessToken(
      input.expiredAccessToken,
    );

    if (!oldPayload) return Result.fail(new Error('Invalid access token'));

    const newAccessToken = this.tokenService.signAccessToken({
      sub: session.userId,
      sessionId: session.id,
      email: oldPayload.email,
      type: oldPayload.type,
      adminRole: oldPayload.adminRole,
    });

    return Result.ok({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }
}
