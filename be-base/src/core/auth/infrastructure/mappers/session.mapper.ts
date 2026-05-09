import { Session } from '../../domain/entities/session.entity';
import { DeviceInfo } from '../../domain/value-objects/device-info.vo';

export interface SessionRecord {
  id: string;
  userId: string;
  userEmail: string;
  userType: string;
  isAdmin: boolean;
  refreshTokenHash: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export class SessionMapper {
  static toDomain(r: SessionRecord): Session {
    return Session.reconstitute(r.id, {
      userId: r.userId,
      userEmail: r.userEmail,
      userType: r.userType,
      isAdmin: r.isAdmin,
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

  static toPrisma(session: Session): SessionRecord {
    return {
      id: session.id,
      userId: session.userId,
      userEmail: session.userEmail,
      userType: session.userType,
      isAdmin: session.isAdmin,
      refreshTokenHash: session.refreshTokenHash,
      deviceName: session.deviceInfo.deviceName,
      ipAddress: session.deviceInfo.ipAddress,
      userAgent: session.deviceInfo.userAgent,
      isActive: session.isActive,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  }
}
