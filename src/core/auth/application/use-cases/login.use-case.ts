import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UseCase, Result } from '../../../../shared/application';
import { Session } from '../../domain/entities/session.entity';
import { DeviceInfo } from '../../domain/value-objects/device-info.vo';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../../domain/services/token.service';
import {
  CREDENTIAL_VALIDATORS,
  type ICredentialValidator,
} from '../../domain/services/credential-validator.interface';

export interface LoginInput {
  email: string;
  password: string;
  type: string; // 'user' | 'merchant' | ...
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

@Injectable()
export class LoginUseCase implements UseCase<LoginInput, Result<LoginOutput>> {
  private readonly validatorMap: Map<string, ICredentialValidator>;

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    @Optional()
    @Inject(CREDENTIAL_VALIDATORS)
    validators: ICredentialValidator[] = [],
  ) {
    const list = Array.isArray(validators)
      ? validators
      : validators
        ? [validators as ICredentialValidator]
        : [];
    this.validatorMap = new Map(list.map((v) => [v.type, v]));
  }

  async execute(input: LoginInput): Promise<Result<LoginOutput>> {
    const validator = this.validatorMap.get(input.type);
    if (!validator) {
      return Result.fail(new Error(`Unknown identity type: "${input.type}"`));
    }

    const identity = await validator.validate(input.email, input.password);
    if (!identity) {
      return Result.fail(
        new UnauthorizedException('Invalid email or password'),
      );
    }

    const deviceInfo = DeviceInfo.create({
      deviceName: input.deviceName,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    const sessionId = randomUUID();

    const session = Session.create({
      id: sessionId,
      userId: identity.id,
      refreshTokenHash: this.tokenService.hashToken(refreshToken),
      deviceInfo,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });

    await this.sessionRepo.save(session);

    const accessToken = this.tokenService.signAccessToken({
      sub: identity.id,
      sessionId,
      email: identity.email,
      type: identity.type,
      adminRole: identity.role,
    });

    return Result.ok({ accessToken, refreshToken, sessionId });
  }
}
