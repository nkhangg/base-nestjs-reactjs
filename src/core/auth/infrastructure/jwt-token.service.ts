import { Injectable } from '@nestjs/common';
import { sign, verify, decode } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {
  type ITokenService,
  type AccessTokenPayload,
  generateSecureToken,
} from '../domain/services/token.service';

export interface JwtConfig {
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
}

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtConfig) {}

  signAccessToken(payload: AccessTokenPayload): string {
    const { sub, sessionId, email, type, adminRole } = payload;
    return sign(
      { sub, sessionId, email, type, adminRole },
      this.config.accessTokenSecret,
      { expiresIn: this.config.accessTokenTtlSeconds },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return verify(token, this.config.accessTokenSecret) as AccessTokenPayload;
  }

  decodeAccessToken(token: string): AccessTokenPayload {
    return decode(token) as AccessTokenPayload;
  }

  generateRefreshToken(): string {
    return generateSecureToken();
  }

  hashToken(token: string): string {
    return bcrypt.hashSync(token, 10);
  }

  compareTokenHash(token: string, hash: string): boolean {
    return bcrypt.compareSync(token, hash);
  }

  getRefreshTokenExpiresAt(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.config.refreshTokenTtlDays);
    return date;
  }
}
