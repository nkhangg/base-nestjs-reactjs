import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import {
  ACTIVITY_LOG_REPOSITORY,
  type IActivityLogRepository,
} from '../../domain/repositories/activity-log.repository';
import { Inject } from '@nestjs/common';

@ApiTags('Progress (Admin)')
@ApiCookieAuth('access_token')
@UseGuards(AdminAuthGuard)
@Controller('admin/progress')
export class ProgressAdminController {
  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityRepo: IActivityLogRepository,
  ) {}

  @Get('users/:id')
  @RequirePermission('progress-management', 'read')
  @ApiOperation({ summary: "View a user's activity log" })
  async getUserActivity(@Param('id') userId: string) {
    const { data, total } = await this.activityRepo.listByUser({
      userId,
      page: 1,
      pageSize: 50,
    });
    return {
      total,
      data: data.map((l) => ({
        id: l.id.value,
        actionType: l.actionType,
        xpGained: l.xpGained,
        referenceId: l.referenceId,
        createdAt: l.createdAt,
      })),
    };
  }
}
