import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Result } from '../../../../shared/application';
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
  OAUTH_IDENTITY_PROVIDERS,
  type IOAuthIdentityProvider,
} from '../../domain/services/oauth-identity-provider.interface';
import {
  OAUTH_USER_CONNECTORS,
  type IOAuthUserConnector,
} from '../../domain/services/oauth-user-connector.interface';
import type { LoginOutput } from './login.use-case';

export interface OAuthLoginInput {
  provider: string;
  accessToken: string;
  type: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class OAuthLoginUseCase {
  private readonly providerMap: Map<string, IOAuthIdentityProvider>;
  private readonly connectorMap: Map<string, IOAuthUserConnector>;

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    @Optional()
    @Inject(OAUTH_IDENTITY_PROVIDERS)
    providers: IOAuthIdentityProvider | IOAuthIdentityProvider[] = [],
    @Optional()
    @Inject(OAUTH_USER_CONNECTORS)
    connectors: IOAuthUserConnector | IOAuthUserConnector[] = [],
  ) {
    const providerList = Array.isArray(providers)
      ? providers
      : providers
        ? [providers]
        : [];
    const connectorList = Array.isArray(connectors)
      ? connectors
      : connectors
        ? [connectors]
        : [];
    this.providerMap = new Map(providerList.map((p) => [p.provider, p]));
    this.connectorMap = new Map(connectorList.map((c) => [c.type, c]));
  }

  async execute(input: OAuthLoginInput): Promise<Result<LoginOutput>> {
    const provider = this.providerMap.get(input.provider);
    if (!provider) {
      return Result.fail(
        new BadRequestException(
          `OAuth provider "${input.provider}" không được hỗ trợ`,
        ),
      );
    }

    const connector = this.connectorMap.get(input.type);
    if (!connector) {
      return Result.fail(
        new BadRequestException(
          `Loại tài khoản "${input.type}" không hỗ trợ OAuth`,
        ),
      );
    }

    const userInfo = await provider.getUserInfo(input.accessToken);
    if (!userInfo) {
      return Result.fail(
        new UnauthorizedException('Access token không hợp lệ'),
      );
    }

    const identity = await connector.findOrCreateFromOAuth(
      input.provider,
      userInfo,
    );

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
      userEmail: identity.email,
      userType: identity.type,
      isAdmin: identity.isAdmin ?? false,
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
      isAdmin: identity.isAdmin,
    });

    return Result.ok({ accessToken, refreshToken, sessionId });
  }
}
