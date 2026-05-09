import { Injectable } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';

@Injectable()
export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    return record ? PasswordResetTokenMapper.toDomain(record) : null;
  }

  async save(token: PasswordResetToken): Promise<void> {
    const { id, ...data } = PasswordResetTokenMapper.toPrisma(token);
    await this.prisma.passwordResetToken.upsert({
      where: { id },
      create: { id, ...data },
      update: { usedAt: token.usedAt },
    });
  }
}
