import { Injectable } from '@nestjs/common';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import { Session } from '../../domain/entities/session.entity';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { SessionMapper } from '../mappers/session.mapper';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Session | null> {
    const r = await this.prisma.session.findUnique({ where: { id } });
    return r ? SessionMapper.toDomain(r) : null;
  }

  async findByUserId(userId: string, onlyActive?: boolean): Promise<Session[]> {
    const rows = await this.prisma.session.findMany({
      where: {
        userId,
        ...(onlyActive !== undefined ? { isActive: onlyActive } : {}),
      },
    });
    return rows.map((r) => SessionMapper.toDomain(r));
  }

  async save(session: Session): Promise<void> {
    const { id, ...data } = SessionMapper.toPrisma(session);
    await this.prisma.session.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }
}
