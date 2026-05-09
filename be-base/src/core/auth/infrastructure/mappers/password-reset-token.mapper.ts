import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  userType: string;
  userEmail: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PasswordResetTokenMapper {
  static toDomain(r: PasswordResetTokenRecord): PasswordResetToken {
    return PasswordResetToken.reconstitute({
      id: r.id,
      userId: r.userId,
      userType: r.userType,
      userEmail: r.userEmail,
      tokenHash: r.tokenHash,
      expiresAt: r.expiresAt,
      usedAt: r.usedAt,
      createdAt: r.createdAt,
    });
  }

  static toPrisma(token: PasswordResetToken): PasswordResetTokenRecord {
    return {
      id: token.id,
      userId: token.userId,
      userType: token.userType,
      userEmail: token.userEmail,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
      createdAt: token.createdAt,
    };
  }
}
