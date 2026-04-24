import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
  type AuditLogFindOptions,
  type AuditLogFindResult,
} from '../../domain/repositories/audit-log.repository';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly repo: IAuditLogRepository,
  ) {}

  execute(input: AuditLogFindOptions = {}): Promise<AuditLogFindResult> {
    return this.repo.findAll(input);
  }
}
