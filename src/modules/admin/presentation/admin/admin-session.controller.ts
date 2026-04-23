import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  Paginate,
  type PaginateQuery,
  ApiPaginationQuery,
  FilterOperator,
} from 'nestjs-paginate';
import { AdminAuthGuard } from '../../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../../core/admin-shell/require-permission.decorator';
import { ListAdminSessionsUseCase } from '../../application/use-cases/list-admin-sessions.use-case';
import { GetAdminAuthLogsUseCase } from '../../application/use-cases/get-admin-auth-logs.use-case';
import { RevokeAdminSessionUseCase } from '../../application/use-cases/revoke-admin-session.use-case';

const SESSION_PAGINATE_CONFIG = {
  sortableColumns: ['createdAt', 'lastActiveAt', 'expiresAt'],
  filterableColumns: {
    isActive: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

@ApiTags('Admin Sessions')
@ApiCookieAuth('access_token')
@Controller('admin/management/:id/sessions')
@UseGuards(AdminAuthGuard)
export class AdminSessionController {
  constructor(
    private readonly listSessionsUseCase: ListAdminSessionsUseCase,
    private readonly getAuthLogsUseCase: GetAdminAuthLogsUseCase,
    private readonly revokeSessionUseCase: RevokeAdminSessionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin-management', 'read')
  @ApiOperation({ summary: 'Danh sách session của admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  @ApiPaginationQuery(SESSION_PAGINATE_CONFIG)
  @ApiResponse({ status: 200, description: 'Danh sách session' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy admin' })
  async listSessions(
    @Param('id') id: string,
    @Paginate() query: PaginateQuery,
  ) {
    const isActiveRaw = query.filter?.['isActive'];
    const isActiveStr = Array.isArray(isActiveRaw)
      ? isActiveRaw[0]
      : isActiveRaw;

    const result = await this.listSessionsUseCase.execute({
      adminId: id,
      onlyActive:
        isActiveStr === 'true'
          ? true
          : isActiveStr === 'false'
            ? false
            : undefined,
      page: query.page ?? 1,
      pageSize: query.limit ?? SESSION_PAGINATE_CONFIG.defaultLimit,
    });

    if (!result.ok) throw new NotFoundException(result.error);

    const { data, total } = result.value;
    const page = query.page ?? 1;
    const pageSize = query.limit ?? SESSION_PAGINATE_CONFIG.defaultLimit;

    return {
      success: true,
      data: data.map((s) => ({
        id: s.id,
        isActive: s.isActive,
        isExpired: s.isExpired(),
        deviceName: s.deviceInfo.deviceName,
        ipAddress: s.deviceInfo.ipAddress,
        userAgent: s.deviceInfo.userAgent,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      })),
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  @Get('auth-logs')
  @RequirePermission('admin-management', 'read')
  @ApiOperation({ summary: 'Lịch sử đăng nhập / auth log của admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiPaginationQuery({
    sortableColumns: ['loginAt'],
    defaultLimit: 20,
    maxLimit: 100,
  })
  @ApiResponse({ status: 200, description: 'Auth logs' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy admin' })
  async getAuthLogs(@Param('id') id: string, @Paginate() query: PaginateQuery) {
    const result = await this.getAuthLogsUseCase.execute({
      adminId: id,
      page: query.page ?? 1,
      pageSize: query.limit ?? 20,
    });

    if (!result.ok) throw new NotFoundException(result.error);

    const { data, total } = result.value;
    const page = query.page ?? 1;
    const pageSize = query.limit ?? 20;

    return {
      success: true,
      data,
      meta: {
        totalItems: total,
        currentPage: page,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  @Delete(':sessionId')
  @HttpCode(200)
  @RequirePermission('admin-management', 'delete')
  @ApiOperation({ summary: 'Thu hồi một session của admin' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Thu hồi thành công' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy admin hoặc session',
  })
  async revokeSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.revokeSessionUseCase.execute({
      adminId: id,
      sessionId,
    });

    if (!result.ok) return { success: false, error: result.error };
    return { success: true };
  }
}
