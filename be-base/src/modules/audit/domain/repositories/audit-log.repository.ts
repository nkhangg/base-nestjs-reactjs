import type { AuditLog } from '../entities/audit-log.entity';

export interface AuditLogFindOptions {
  actorId?: string;
  resource?: string;
  permission?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface AuditLogFindResult {
  data: AuditLog[];
  total: number;
}

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<void>;
  findAll(options?: AuditLogFindOptions): Promise<AuditLogFindResult>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
