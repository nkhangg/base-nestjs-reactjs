import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import { PermissionGuard } from '../../../../core/authorization';
import { Permission } from '../../../../core/authorization';
import {
  ListMyNotificationsUseCase,
  type NotificationListItem,
} from '../../application/use-cases/list-my-notifications.use-case';
import { GetUnreadCountUseCase } from '../../application/use-cases/get-unread-count.use-case';
import { MarkAsReadUseCase } from '../../application/use-cases/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from '../../application/use-cases/mark-all-as-read.use-case';
import { DeleteNotificationUseCase } from '../../application/use-cases/delete-notification.use-case';
import {
  parsePage,
  filterBool,
  buildPaginated,
} from '../../../../shared/application/paginate';
const MY_NOTIFICATIONS_CONFIG = {
  sortableColumns: ['createdAt'],
  searchableColumns: ['title', 'body'],
  filterableColumns: { isRead: [FilterOperator.EQ] },
  defaultLimit: 20,
  maxLimit: 100,
};

function mapItem(item: NotificationListItem) {
  return {
    id: item.recipientId,
    notificationId: item.notificationId,
    title: item.title,
    body: item.body,
    type: item.type,
    isRead: item.isRead,
    readAt: item.readAt,
    createdAt: item.createdAt,
  };
}

@ApiTags('Notifications')
@ApiCookieAuth('access_token')
@Controller('notifications')
@UseGuards(PermissionGuard)
export class NotificationUserController {
  constructor(
    private readonly listUseCase: ListMyNotificationsUseCase,
    private readonly unreadCountUseCase: GetUnreadCountUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
    private readonly deleteUseCase: DeleteNotificationUseCase,
  ) {}

  @Get('unread-count')
  @Permission('notifications', 'read')
  @ApiOperation({ summary: 'Đếm thông báo chưa đọc' })
  async unreadCount(
    @Request() req: { user: { userId: string; type: string } },
  ) {
    const count = await this.unreadCountUseCase.execute(
      req.user.userId,
      req.user.type,
    );
    return { success: true, data: { count } };
  }

  @Patch('read-all')
  @HttpCode(200)
  @Permission('notifications', 'update')
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  async markAllAsRead(
    @Request() req: { user: { userId: string; type: string } },
  ) {
    await this.markAllAsReadUseCase.execute(req.user.userId, req.user.type);
    return { success: true };
  }

  @Get()
  @Permission('notifications', 'read')
  @ApiOperation({ summary: 'Danh sách thông báo của tôi' })
  @ApiPaginationQuery(MY_NOTIFICATIONS_CONFIG)
  async list(
    @Request() req: { user: { userId: string; type: string } },
    @Paginate() query: PaginateQuery,
  ) {
    const { page, limit, search, filter } = parsePage(
      query,
      MY_NOTIFICATIONS_CONFIG,
    );
    const { data, total } = await this.listUseCase.execute({
      recipientId: req.user.userId,
      recipientType: req.user.type as 'user' | 'admin',
      page,
      pageSize: limit,
      isRead: filterBool(filter, 'isRead'),
      search,
    });
    return buildPaginated(
      data.map(mapItem),
      total,
      query,
      MY_NOTIFICATIONS_CONFIG,
    );
  }

  @Patch(':id/read')
  @HttpCode(200)
  @Permission('notifications', 'update')
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.markAsReadUseCase.execute(id, req.user.userId);
    if (!result.ok) {
      if (result.error === 'NOT_FOUND') throw new NotFoundException();
      throw new ForbiddenException();
    }
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(200)
  @Permission('notifications', 'delete')
  @ApiOperation({ summary: 'Xóa thông báo (soft-delete)' })
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const result = await this.deleteUseCase.execute(id, req.user.userId);
    if (!result.ok) {
      if (result.error === 'NOT_FOUND') throw new NotFoundException();
      throw new ForbiddenException();
    }
    return { success: true };
  }
}
