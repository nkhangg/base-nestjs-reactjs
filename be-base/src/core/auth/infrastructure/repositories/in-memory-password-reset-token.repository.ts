import { Injectable } from '@nestjs/common';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import { PasswordResetTokenMapper, PasswordResetTokenRecord } from '../mappers/password-reset-token.mapper';

@Injectable()
export class InMemoryPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private store = new Map<string, PasswordResetTokenRecord>();

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    for (const record of this.store.values()) {
      if (record.tokenHash === tokenHash) {
        return PasswordResetTokenMapper.toDomain(record);
      }
    }
    return null;
  }

  async save(token: PasswordResetToken): Promise<void> {
    this.store.set(token.id, PasswordResetTokenMapper.toPrisma(token));
  }
}
