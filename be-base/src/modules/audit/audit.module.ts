import { Module } from '@nestjs/common';
import type { ClassProvider, ValueProvider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ADMIN_FEATURE } from '../../core/admin-shell/admin.interface';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository';
import { PrismaAuditLogRepository } from './infrastructure/repositories/prisma-audit-log.repository';
import { AuditInterceptor } from './infrastructure/interceptors/audit.interceptor';
import { ListAuditLogsUseCase } from './application/use-cases/list-audit-logs.use-case';
import { AuditLogController } from './presentation/audit-log.controller';
import { AuditLogFeature } from './presentation/audit-log.feature';

@Module({
  controllers: [AuditLogController],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    } as ClassProvider,
    {
      provide: ADMIN_FEATURE,
      useValue: AuditLogFeature,
      multi: true,
    } as ValueProvider,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    } as ClassProvider,
    ListAuditLogsUseCase,
  ],
})
export class AuditModule {}
