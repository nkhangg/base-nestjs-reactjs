import { BaseEntity } from '../../../../shared/domain/base-entity';
import { NotificationId } from '../value-objects/notification-id.vo';

export type NotificationType =
  | 'system'
  | 'info'
  | 'warning'
  | 'alert'
  | 'success';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  senderId: string | null;
  senderType: 'admin' | 'system' | null;
  createdAt: Date;
}

export class Notification extends BaseEntity<NotificationId> {
  private props: NotificationProps;

  private constructor(id: NotificationId, props: NotificationProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    type?: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    senderId?: string;
    senderType?: 'admin' | 'system';
  }): Notification {
    return new Notification(NotificationId.create(), {
      type: params.type ?? 'info',
      title: params.title,
      body: params.body,
      data: params.data ?? null,
      senderId: params.senderId ?? null,
      senderType: params.senderType ?? null,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: NotificationProps): Notification {
    return new Notification(NotificationId.from(id), props);
  }

  get type(): NotificationType {
    return this.props.type;
  }
  get title(): string {
    return this.props.title;
  }
  get body(): string {
    return this.props.body;
  }
  get data(): Record<string, unknown> | null {
    return this.props.data;
  }
  get senderId(): string | null {
    return this.props.senderId;
  }
  get senderType(): 'admin' | 'system' | null {
    return this.props.senderType;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
