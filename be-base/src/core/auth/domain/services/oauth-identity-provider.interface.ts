export interface OAuthUserInfo {
  providerId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface IOAuthIdentityProvider {
  readonly provider: string;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo | null>;
}

export const OAUTH_IDENTITY_PROVIDERS = Symbol('OAUTH_IDENTITY_PROVIDERS');
