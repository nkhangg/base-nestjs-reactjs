import { Injectable } from '@nestjs/common';
import type {
  IOAuthIdentityProvider,
  OAuthUserInfo,
} from '../domain/services/oauth-identity-provider.interface';

@Injectable()
export class GoogleOAuthProvider implements IOAuthIdentityProvider {
  readonly provider = 'google';

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        sub: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      if (!data.email) return null;

      return {
        providerId: data.sub,
        email: data.email,
        firstName: data.given_name ?? null,
        lastName: data.family_name ?? null,
        avatarUrl: data.picture ?? null,
      };
    } catch {
      return null;
    }
  }
}
