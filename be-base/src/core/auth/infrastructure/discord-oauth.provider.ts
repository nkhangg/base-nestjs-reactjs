import { Injectable } from '@nestjs/common';
import type {
  IOAuthIdentityProvider,
  OAuthUserInfo,
} from '../domain/services/oauth-identity-provider.interface';

@Injectable()
export class DiscordOAuthProvider implements IOAuthIdentityProvider {
  readonly provider = 'discord';

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo | null> {
    try {
      const res = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        id: string;
        email?: string;
        global_name?: string | null;
        username: string;
        avatar?: string | null;
      };

      // Discord requires the email scope — reject if not present
      if (!data.email) return null;

      const avatarUrl = data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : null;

      return {
        providerId: data.id,
        email: data.email,
        firstName: data.global_name ?? data.username,
        lastName: null,
        avatarUrl,
      };
    } catch {
      return null;
    }
  }
}
