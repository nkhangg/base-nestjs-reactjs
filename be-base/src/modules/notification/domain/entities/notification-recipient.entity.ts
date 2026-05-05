import { BaseEntity } from '../../../../shared/domain/base-entity';
import { NotificationRecipientId } from '../value-objects/notification-recipient-id.vo';

export type RecipientType = 'user' | 'admin';

export interface NotificationRecipientProps {
  notificationId: string;
  recipientId: string;
  recipientType: RecipientType;
  isRead: boolean;
  readAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

export class NotificationRecipient extends BaseEntity<NotificationRecipientId> {
  private props: NotificationRecipientProps;

  private constructor(
    id: NotificationRecipientId,
    props: NotificationRecipientProps,
  ) {
    super(id);
    this.props = props;
  }

  static create(params: {
    notificationId: string;
    recipientId: string;
    recipientType: RecipientType;
  }): NotificationRecipient {
    return new NotificationRecipient(NotificationRecipientId.create(), {
      notificationId: params.notificationId,
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      isRead: false,
      readAt: null,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(
    id: string,
    props: NotificationRecipientProps,
  ): NotificationRecipient {
    return new NotificationRecipient(NotificationRecipientId.from(id), props);
  }

  markAsRead(): void {
    if (!this.props.isRead) {
      this.props.isRead = true;
      this.props.readAt = new Date();
    }
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.deletedAt = new Date();
  }

  get notificationId(): string {
    return this.props.notificationId;
  }
  get recipientId(): string {
    return this.props.recipientId;
  }
  get recipientType(): RecipientType {
    return this.props.recipientType;
  }
  get isRead(): boolean {
    return this.props.isRead;
  }
  get readAt(): Date | null {
    return this.props.readAt;
  }
  get isDeleted(): boolean {
    return this.props.isDeleted;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
