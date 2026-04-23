import { Injectable } from '@nestjs/common';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import { Session } from '../../domain/entities/session.entity';
import { DeviceInfo } from '../../domain/value-objects/device-info.vo';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Session | null> {
    const r = await this.prisma.session.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByUserId(userId: string, onlyActive = false): Promise<Session[]> {
    const rows = await this.prisma.session.findMany({
      where: { userId, ...(onlyActive ? { isActive: true } : {}) },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(session: Session): Promise<void> {
    const data = {
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      deviceName: session.deviceInfo.deviceName,
      ipAddress: session.deviceInfo.ipAddress,
      userAgent: session.deviceInfo.userAgent,
      isActive: session.isActive,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
    await this.prisma.session.upsert({
      where: { id: session.id },
      create: { id: session.id, ...data },
      update: data,
    });
  }

  private toDomain(r: SessionRecord): Session {
    return Session.reconstitute(r.id, {
      userId: r.userId,
      refreshTokenHash: r.refreshTokenHash,
      deviceInfo: DeviceInfo.create({
        deviceName: r.deviceName,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
      }),
      isActive: r.isActive,
      lastActiveAt: r.lastActiveAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    });
  }
}
