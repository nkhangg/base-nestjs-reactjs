import type { Notification } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findManyByIds(ids: string[]): Promise<Notification[]>;
  findAll(params: {
    page: number;
    pageSize: number;
    senderId?: string;
    type?: string;
    search?: string;
    sortBy?: 'createdAt' | 'type';
    sortDir?: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: Notification[]; total: number }>;
  save(notification: Notification): Promise<void>;
}
