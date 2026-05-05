import * as crypto from 'crypto';

export interface AccessTokenPayload {
  sub: string; // userId
  sessionId: string;
  email: string;
  type: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export interface ITokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  /** Verify chữ ký nhưng bỏ qua expiry — dùng cho WebSocket handshake */
  verifyAccessTokenIgnoreExpiry(token: string): AccessTokenPayload;
  decodeAccessToken(token: string): AccessTokenPayload; // không verify exp
  generateRefreshToken(): string;
  hashToken(token: string): string;
  compareTokenHash(token: string, hash: string): boolean;
  getRefreshTokenExpiresAt(): Date;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export function generateSecureToken(): string {
  return crypto.randomBytes(48).toString('hex');
}
