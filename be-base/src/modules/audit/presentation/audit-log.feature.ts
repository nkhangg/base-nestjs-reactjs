import type { AdminFeature } from '../../../core/admin-shell/admin.interface';
import { AuditLogController } from './audit-log.controller';

export const AuditLogFeature: AdminFeature = {
  resource: 'audit-logs',
  controller: AuditLogController,
  permissions: ['read'],
  menu: {
    label: 'Audit Logs',
    icon: 'shield-check',
    order: 99,
  },
};
