import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { ADMIN_PERMISSION_KEY } from '../../../../core/admin-shell/require-permission.decorator';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
} from '../../domain/repositories/audit-log.repository';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: IAuditLogRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.adminRole) return next.handle();

    const start = Date.now();

    const meta = this.reflector.getAllAndOverride<{
      resource: string;
      permission: string;
    }>(ADMIN_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const resource = meta?.resource ?? 'unknown';
    const permission = meta?.permission ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          this.writeLog({
            user,
            resource,
            permission,
            method: request.method,
            path: request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - start,
            ipAddress: request.ip ?? '',
            userAgent: (request.headers['user-agent'] as string) ?? '',
          });
        },
        error: (err: { status?: number }) => {
          this.writeLog({
            user,
            resource,
            permission,
            method: request.method,
            path: request.url,
            statusCode: err?.status ?? 500,
            durationMs: Date.now() - start,
            ipAddress: request.ip ?? '',
            userAgent: (request.headers['user-agent'] as string) ?? '',
          });
        },
      }),
    );
  }

  private writeLog(data: {
    user: NonNullable<Request['user']>;
    resource: string;
    permission: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    ipAddress: string;
    userAgent: string;
  }): void {
    const log = AuditLog.create({
      actorId: data.user.userId,
      actorEmail: data.user.email,
      actorRole: data.user.adminRole ?? 'unknown',
      resource: data.resource,
      permission: data.permission,
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      durationMs: data.durationMs,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    this.auditRepo.save(log).catch((err: unknown) => {
      this.logger.error('Failed to write audit log', err);
    });
  }
}
