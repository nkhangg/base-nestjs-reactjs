import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { INotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';
import type { NotificationRecipient } from '../../domain/entities/notification-recipient.entity';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class PrismaNotificationRecipientRepository implements INotificationRecipientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NotificationRecipient | null> {
    const raw = await this.prisma.notificationRecipient.findUnique({
      where: { id },
    });
    return raw ? NotificationMapper.recipientToDomain(raw) : null;
  }

  async findByNotificationId(
    notificationId: string,
  ): Promise<NotificationRecipient[]> {
    const rows = await this.prisma.notificationRecipient.findMany({
      where: { notificationId },
    });
    return rows.map(NotificationMapper.recipientToDomain);
  }

  async findByRecipient(params: {
    recipientId: string;
    recipientType: string;
    page: number;
    pageSize: number;
    isRead?: boolean;
    search?: string;
  }): Promise<{ data: NotificationRecipient[]; total: number }> {
    const skip = (params.page - 1) * params.pageSize;
    const where: Record<string, unknown> = {
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      isDeleted: false,
    };
    if (params.isRead !== undefined) where.isRead = params.isRead;
    if (params.search) {
      where.notification = {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { body: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    type WhereClause = Parameters<
      typeof this.prisma.notificationRecipient.findMany
    >[0] extends { where?: infer W }
      ? W
      : never;
    const prismaWhere = where as WhereClause;

    const [rows, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where: prismaWhere,
        include: { notification: true },
        skip,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationRecipient.count({ where: prismaWhere }),
    ]);

    return { data: rows.map(NotificationMapper.recipientToDomain), total };
  }

  async countUnread(
    recipientId: string,
    recipientType: string,
  ): Promise<number> {
    return this.prisma.notificationRecipient.count({
      where: { recipientId, recipientType, isRead: false, isDeleted: false },
    });
  }

  async summarizeByNotificationIds(
    ids: string[],
  ): Promise<
    Array<{ notificationId: string; adminCount: number; userCount: number }>
  > {
    if (ids.length === 0) return [];
    const rows = await this.prisma.notificationRecipient.groupBy({
      by: ['notificationId', 'recipientType'],
      where: { notificationId: { in: ids } },
      _count: { id: true },
    });

    const map = new Map<string, { adminCount: number; userCount: number }>();
    for (const row of rows) {
      const entry = map.get(row.notificationId) ?? {
        adminCount: 0,
        userCount: 0,
      };
      if (row.recipientType === 'admin') entry.adminCount = row._count.id;
      else if (row.recipientType === 'user') entry.userCount = row._count.id;
      map.set(row.notificationId, entry);
    }

    return ids.map((id) => ({
      notificationId: id,
      ...(map.get(id) ?? { adminCount: 0, userCount: 0 }),
    }));
  }

  async save(recipient: NotificationRecipient): Promise<void> {
    await this.prisma.notificationRecipient.upsert({
      where: { id: recipient.id.value },
      create: {
        id: recipient.id.value,
        notificationId: recipient.notificationId,
        recipientId: recipient.recipientId,
        recipientType: recipient.recipientType,
        isRead: recipient.isRead,
        readAt: recipient.readAt,
        isDeleted: recipient.isDeleted,
        deletedAt: recipient.deletedAt,
        createdAt: recipient.createdAt,
      },
      update: {
        isRead: recipient.isRead,
        readAt: recipient.readAt,
        isDeleted: recipient.isDeleted,
        deletedAt: recipient.deletedAt,
      },
    });
  }

  async saveMany(recipients: NotificationRecipient[]): Promise<void> {
    await Promise.all(recipients.map((r) => this.save(r)));
  }

  async markAllAsRead(
    recipientId: string,
    recipientType: string,
  ): Promise<void> {
    await this.prisma.notificationRecipient.updateMany({
      where: { recipientId, recipientType, isRead: false, isDeleted: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
