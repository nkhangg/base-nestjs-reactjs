import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Paginate, type PaginateQuery, FilterOperator } from 'nestjs-paginate';
import { ApiPaginationQuery } from 'nestjs-paginate';
import { AdminAuthGuard } from '../../../core/admin-shell/admin-auth.guard';
import { RequirePermission } from '../../../core/admin-shell/require-permission.decorator';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';
import {
  buildPaginated,
  filterStr,
  parsePage,
} from '../../../shared/application/paginate';

const AUDIT_PAGINATE_CONFIG = {
  sortableColumns: ['occurredAt', 'resource', 'actorEmail'],
  filterableColumns: {
    actorId: [FilterOperator.EQ],
    resource: [FilterOperator.EQ],
    permission: [FilterOperator.EQ],
    dateFrom: [FilterOperator.EQ],
    dateTo: [FilterOperator.EQ],
  },
  defaultLimit: 20,
  maxLimit: 100,
};

@ApiTags('Audit Logs')
@ApiCookieAuth('access_token')
@Controller('admin/audit-logs')
@UseGuards(AdminAuthGuard)
export class AuditLogController {
  constructor(private readonly listUseCase: ListAuditLogsUseCase) {}

  @Get()
  @RequirePermission('audit-logs', 'read')
  @ApiOperation({ summary: 'List audit logs with filters and pagination' })
  @ApiPaginationQuery(AUDIT_PAGINATE_CONFIG)
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  async list(@Paginate() query: PaginateQuery) {
    const { page, limit, filter } = parsePage(query, AUDIT_PAGINATE_CONFIG);

    const dateFromStr = filterStr(filter, 'dateFrom');
    const dateToStr = filterStr(filter, 'dateTo');

    const { data, total } = await this.listUseCase.execute({
      actorId: filterStr(filter, 'actorId'),
      resource: filterStr(filter, 'resource'),
      permission: filterStr(filter, 'permission'),
      dateFrom: dateFromStr ? new Date(dateFromStr) : undefined,
      dateTo: dateToStr ? new Date(dateToStr) : undefined,
      page,
      pageSize: limit,
    });

    return buildPaginated(
      data.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actorEmail: l.actorEmail,
        actorRole: l.actorRole,
        resource: l.resource,
        permission: l.permission,
        method: l.method,
        path: l.path,
        statusCode: l.statusCode,
        durationMs: l.durationMs,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        occurredAt: l.occurredAt,
      })),
      total,
      query,
      AUDIT_PAGINATE_CONFIG,
    );
  }
}
