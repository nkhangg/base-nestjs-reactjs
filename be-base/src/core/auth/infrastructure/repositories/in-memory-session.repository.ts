import { Injectable } from '@nestjs/common';
import { Session } from '../../domain/entities/session.entity';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { DeviceInfo } from '../../domain/value-objects/device-info.vo';

@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private store = new Map<string, ReturnType<typeof this.toRecord>>();

  private toRecord(session: Session) {
    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      deviceInfo: {
        deviceName: session.deviceInfo.deviceName,
        ipAddress: session.deviceInfo.ipAddress,
        userAgent: session.deviceInfo.userAgent,
      },
      isActive: session.isActive,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  }

  private toDomain(r: ReturnType<typeof this.toRecord>): Session {
    return Session.reconstitute(r.id, {
      userId: r.userId,
      refreshTokenHash: r.refreshTokenHash,
      deviceInfo: DeviceInfo.create(r.deviceInfo),
      isActive: r.isActive,
      lastActiveAt: r.lastActiveAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    });
  }

  findById(id: string): Promise<Session | null> {
    const r = this.store.get(id);
    return Promise.resolve(r ? this.toDomain(r) : null);
  }

  findByUserId(userId: string, onlyActive = false): Promise<Session[]> {
    const result = [...this.store.values()]
      .filter((r) => r.userId === userId && (!onlyActive || r.isActive))
      .map((r) => this.toDomain(r));
    return Promise.resolve(result);
  }

  save(session: Session): Promise<void> {
    this.store.set(session.id, this.toRecord(session));
    return Promise.resolve();
  }
}
