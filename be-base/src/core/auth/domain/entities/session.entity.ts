import { BaseAggregate } from '../../../../shared/domain';
import { DeviceInfo } from '../value-objects/device-info.vo';

export interface SessionProps {
  userId: string;
  refreshTokenHash: string;
  deviceInfo: DeviceInfo;
  isActive: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export class Session extends BaseAggregate<string> {
  private props: SessionProps;

  private constructor(id: string, props: SessionProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    deviceInfo: DeviceInfo;
    expiresAt: Date;
  }): Session {
    return new Session(params.id, {
      userId: params.userId,
      refreshTokenHash: params.refreshTokenHash,
      deviceInfo: params.deviceInfo,
      isActive: true,
      lastActiveAt: new Date(),
      expiresAt: params.expiresAt,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: SessionProps): Session {
    return new Session(id, props);
  }

  revoke(): void {
    this.props.isActive = false;
  }

  touch(): void {
    this.props.lastActiveAt = new Date();
  }

  rotateRefreshToken(newHash: string, newExpiresAt: Date): void {
    this.props.refreshTokenHash = newHash;
    this.props.expiresAt = newExpiresAt;
    this.props.lastActiveAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isValid(): boolean {
    return this.props.isActive && !this.isExpired();
  }

  get userId(): string {
    return this.props.userId;
  }
  get refreshTokenHash(): string {
    return this.props.refreshTokenHash;
  }
  get deviceInfo(): DeviceInfo {
    return this.props.deviceInfo;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get lastActiveAt(): Date {
    return this.props.lastActiveAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
