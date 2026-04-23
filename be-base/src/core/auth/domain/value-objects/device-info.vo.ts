import { ValueObject } from '../../../../shared/domain';

interface DeviceInfoProps {
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}

export class DeviceInfo extends ValueObject<DeviceInfoProps> {
  private constructor(props: DeviceInfoProps) {
    super(props);
  }

  static create(props: DeviceInfoProps): DeviceInfo {
    return new DeviceInfo({
      deviceName: props.deviceName?.trim() || 'Unknown device',
      ipAddress: props.ipAddress || '',
      userAgent: props.userAgent || '',
    });
  }

  get deviceName(): string {
    return this.props.deviceName;
  }
  get ipAddress(): string {
    return this.props.ipAddress;
  }
  get userAgent(): string {
    return this.props.userAgent;
  }
}
