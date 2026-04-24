import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  IAuditLogRepository,
  AuditLogFindOptions,
  AuditLogFindResult,
} from '../../domain/repositories/audit-log.repository';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(log: AuditLog): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        id: log.id,
        actorId: log.actorId,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        resource: log.resource,
        permission: log.permission,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        durationMs: log.durationMs,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        occurredAt: log.occurredAt,
      },
    });
  }

  async findAll(
    options: AuditLogFindOptions = {},
  ): Promise<AuditLogFindResult> {
    const where: Record<string, unknown> = {};

    if (options.actorId) where['actorId'] = options.actorId;
    if (options.resource) where['resource'] = options.resource;
    if (options.permission) where['permission'] = options.permission;
    if (options.dateFrom || options.dateTo) {
      where['occurredAt'] = {
        ...(options.dateFrom ? { gte: options.dateFrom } : {}),
        ...(options.dateTo ? { lte: options.dateTo } : {}),
      };
    }

    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: rows.map((r) => AuditLog.reconstitute(r)),
      total,
    };
  }
}
