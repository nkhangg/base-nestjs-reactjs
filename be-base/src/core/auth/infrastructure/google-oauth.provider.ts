import { Injectable, Logger } from '@nestjs/common';
import type {
  IOAuthIdentityProvider,
  OAuthUserInfo,
} from '../domain/services/oauth-identity-provider.interface';

@Injectable()
export class GoogleOAuthProvider implements IOAuthIdentityProvider {
  readonly provider = 'google';

  private readonly logger = new Logger(GoogleOAuthProvider.name);
  private readonly clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo | null> {
    try {
      // Fail-safe in production: nếu chưa cấu hình client_id thì cấm login để
      // tránh attacker dùng access token cấp cho app khác (token replay).
      if (!this.clientId && this.isProduction) {
        this.logger.warn(
          'GOOGLE_CLIENT_ID is not configured — denying Google OAuth login in production',
        );
        return null;
      }

      const tokenInfo = await this.fetchTokenInfo(accessToken);
      if (!tokenInfo) return null;

      if (this.clientId && tokenInfo.aud !== this.clientId) {
        this.logger.warn(
          `Google access token audience mismatch (got "${tokenInfo.aud}")`,
        );
        return null;
      }

      if (tokenInfo.email_verified === 'false') {
        this.logger.warn('Google account email is not verified — rejecting');
        return null;
      }

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

  private async fetchTokenInfo(
    accessToken: string,
  ): Promise<{ aud: string; email_verified?: string } | null> {
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      );
      if (!res.ok) return null;
      return (await res.json()) as { aud: string; email_verified?: string };
    } catch {
      return null;
    }
  }
}
