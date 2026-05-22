import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { INotificationRepository } from '../../domain/repositories/notification.repository';
import type { Notification } from '../../domain/entities/notification.entity';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByIds(ids: string[]): Promise<Notification[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.notification.findMany({
      where: { id: { in: ids } },
    });
    return rows.map(NotificationMapper.toDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const raw = await this.prisma.notification.findUnique({ where: { id } });
    return raw ? NotificationMapper.toDomain(raw) : null;
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    senderId?: string;
    type?: string;
    search?: string;
    sortBy?: 'createdAt' | 'type';
    sortDir?: 'asc' | 'desc';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: Notification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = {};
    if (params.senderId) where.senderId = params.senderId;
    if (params.type) where.type = params.type;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {
        ...(params.dateFrom
          ? {
              gte: new Date(
                params.dateFrom.includes('T')
                  ? params.dateFrom
                  : `${params.dateFrom}T00:00:00.000Z`,
              ),
            }
          : {}),
        ...(params.dateTo
          ? {
              lte: new Date(
                params.dateTo.includes('T')
                  ? params.dateTo
                  : `${params.dateTo}T23:59:59.999Z`,
              ),
            }
          : {}),
      };
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { body: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const sortKey = params.sortBy ?? 'createdAt';
    const sortDir = params.sortDir ?? 'desc';
    const skip = (params.page - 1) * params.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: params.pageSize,
        orderBy: { [sortKey]: sortDir },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: rows.map(NotificationMapper.toDomain), total };
  }

  async save(notification: Notification): Promise<void> {
    await this.prisma.notification.upsert({
      where: { id: notification.id.value },
      create: {
        id: notification.id.value,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: (notification.data as object) ?? undefined,
        senderId: notification.senderId,
        senderType: notification.senderType,
        createdAt: notification.createdAt,
      },
      update: {},
    });
  }
}
