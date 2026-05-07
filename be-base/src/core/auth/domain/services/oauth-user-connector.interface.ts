import type { IAuthIdentity } from './auth-identity.interface';
import type { OAuthUserInfo } from './oauth-identity-provider.interface';

export interface IOAuthUserConnector {
  readonly type: string;
  findOrCreateFromOAuth(
    provider: string,
    info: OAuthUserInfo,
  ): Promise<IAuthIdentity>;
}

export const OAUTH_USER_CONNECTORS = Symbol('OAUTH_USER_CONNECTORS');
