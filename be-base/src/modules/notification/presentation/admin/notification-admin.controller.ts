import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  FilterOperator,
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
} from 'nestjs-paginate';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { ListSentNotificationsUseCase } from '../../application/use-cases/list-sent-notifications.use-case';
import { GetSentNotificationDetailUseCase } from '../../application/use-cases/get-sent-notification-detail.use-case';
import { GetUnreadCountUseCase } from '../../application/use-cases/get-unread-count.use-case';
import {
  parsePage,
  filterStr,
  filterBtw,
  buildPaginated,
} from '../../../../shared/application/paginate';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../../../admin/domain/repositories/admin.repository';
import {
  NOTIFICATION_RECIPIENT_REPOSITORY,
  type INotificationRecipientRepository,
} from '../../domain/repositories/notification-recipient.repository';
import type { NotificationType } from '../../domain/entities/notification.entity';
import type { NotificationTarget } from '../../application/services/notification-target-resolver.service';
import type { NotificationRecipient } from '../../domain/entities/notification-recipient.entity';
import type { Notification } from '../../domain/entities/notification.entity';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class SendNotificationDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional({
    enum: ['system', 'info', 'warning', 'alert', 'success'],
  })
  @IsOptional()
  @IsIn(['system', 'info', 'warning', 'alert', 'success'])
  type?: NotificationType;
  @ApiProperty({ type: [Object] })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  targets!: NotificationTarget[];
}

// ── Paginate config ──────────────────────────────────────────────────────────

const SENT_PAGINATE_CONFIG = {
  sortableColumns: ['createdAt', 'type'],
  searchableColumns: ['title', 'body'],
  filterableColumns: {
    type: [FilterOperator.EQ],
    createdAt: [FilterOperator.BTW],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapNotification(
  n: Notification,
  senderEmail?: string | null,
  recipients?: { adminCount: number; userCount: number },
) {
  return {
    id: n.id.value,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    senderId: n.senderId,
    senderType: n.senderType,
    senderEmail: senderEmail ?? null,
    recipientSummary: recipients ?? { adminCount: 0, userCount: 0 },
    createdAt: n.createdAt,
  };
}

function mapRecipient(r: NotificationRecipient) {
  return {
    id: r.id.value,
    recipientId: r.recipientId,
    recipientType: r.recipientType,
    isRead: r.isRead,
    readAt: r.readAt,
    createdAt: r.createdAt,
  };
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Notification Management')
@ApiCookieAuth('access_token')
@Controller('admin/notifications')
@UseGuards(AdminAuthGuard)
export class NotificationAdminController {
  constructor(
    private readonly sendUseCase: SendNotificationUseCase,
    private readonly listSentUseCase: ListSentNotificationsUseCase,
    private readonly getDetailUseCase: GetSentNotificationDetailUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
    @Inject(NOTIFICATION_RECIPIENT_REPOSITORY)
    private readonly recipientRepo: INotificationRecipientRepository,
  ) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Số thông báo chưa đọc của admin hiện tại' })
  async getUnreadCount(@Request() req: { user?: { userId?: string } }) {
    const count = await this.getUnreadCountUseCase.execute(
      req.user?.userId ?? '',
      'admin',
    );
    return { success: true, data: { count } };
  }

  @Post()
  @RequirePermission('notification-management', 'create')
  @ApiOperation({ summary: 'Gửi thông báo' })
  async send(
    @Body() dto: SendNotificationDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    const result = await this.sendUseCase.execute({
      title: dto.title,
      body: dto.body,
      type: dto.type,
      targets: dto.targets,
      senderId: req.user?.userId,
      senderType: 'admin',
    });
    return { success: true, data: result };
  }

  @Get('sent')
  @RequirePermission('notification-management', 'read')
  @ApiOperation({ summary: 'Lịch sử đã gửi' })
  @ApiPaginationQuery(SENT_PAGINATE_CONFIG)
  async listSent(@Paginate() query: PaginateQuery) {
    const { page, limit, search, filter, sortBy } = parsePage(
      query,
      SENT_PAGINATE_CONFIG,
    );
    const dateRange = filterBtw(filter, 'createdAt');
    const { data, total } = await this.listSentUseCase.execute({
      page,
      pageSize: limit,
      search,
      type: filterStr(filter, 'type'),
      sortBy: sortBy?.[0] as 'createdAt' | 'type' | undefined,
      sortDir: sortBy?.[1]?.toLowerCase() as 'asc' | 'desc' | undefined,
      dateFrom: dateRange?.[0],
      dateTo: dateRange?.[1],
    });

    const notificationIds = data.map((n) => n.id.value);

    // Batch-fetch in parallel: sender emails + recipient summaries
    const adminIds = [
      ...new Set(
        data
          .filter((n) => n.senderType === 'admin' && n.senderId)
          .map((n) => n.senderId!),
      ),
    ];
    const [emailMap, summaries] = await Promise.all([
      Promise.all(
        adminIds.map(async (id) => {
          const admin = await this.adminRepo.findById(id);
          return admin ? ([id, admin.email] as [string, string]) : null;
        }),
      ).then(
        (results) =>
          new Map(results.filter((r): r is [string, string] => r !== null)),
      ),
      this.recipientRepo.summarizeByNotificationIds(notificationIds),
    ]);
    const summaryMap = new Map(summaries.map((s) => [s.notificationId, s]));

    return buildPaginated(
      data.map((n) =>
        mapNotification(
          n,
          n.senderId ? emailMap.get(n.senderId) : null,
          summaryMap.get(n.id.value),
        ),
      ),
      total,
      query,
      SENT_PAGINATE_CONFIG,
    );
  }

  @Get('sent/:id')
  @RequirePermission('notification-management', 'read')
  @ApiOperation({ summary: 'Chi tiết thông báo + danh sách recipients' })
  async getSent(@Param('id') id: string) {
    const { notification, recipients } =
      await this.getDetailUseCase.execute(id);
    if (!notification) throw new NotFoundException('Notification not found');

    let senderEmail: string | null = null;
    if (notification.senderType === 'admin' && notification.senderId) {
      const admin = await this.adminRepo.findById(notification.senderId);
      senderEmail = admin?.email ?? null;
    }

    return {
      success: true,
      data: {
        ...mapNotification(notification, senderEmail),
        recipients: recipients.map(mapRecipient),
      },
    };
  }
}
