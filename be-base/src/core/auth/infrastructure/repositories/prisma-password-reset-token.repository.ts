import { Injectable } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!record) return null;
    return PasswordResetToken.reconstitute({
      id: record.id,
      userId: record.userId,
      userType: record.userType,
      userEmail: record.userEmail,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    });
  }

  async save(token: PasswordResetToken): Promise<void> {
    await this.prisma.passwordResetToken.upsert({
      where: { id: token.id },
      create: {
        id: token.id,
        userId: token.userId,
        userType: token.userType,
        userEmail: token.userEmail,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        usedAt: token.usedAt,
        createdAt: token.createdAt,
      },
      update: {
        usedAt: token.usedAt,
      },
    });
  }
}
