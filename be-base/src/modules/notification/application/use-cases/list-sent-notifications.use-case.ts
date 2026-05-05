import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/repositories/notification.repository';
import type { Notification } from '../../domain/entities/notification.entity';

export interface ListSentNotificationsInput {
  page?: number;
  pageSize?: number;
  senderId?: string;
  type?: string;
  search?: string;
  sortBy?: 'createdAt' | 'type';
  sortDir?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ListSentNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(
    input: ListSentNotificationsInput,
  ): Promise<{ data: Notification[]; total: number }> {
    return this.notificationRepo.findAll({
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
      senderId: input.senderId,
      type: input.type,
      search: input.search,
      sortBy: input.sortBy,
      sortDir: input.sortDir,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
  }
}
