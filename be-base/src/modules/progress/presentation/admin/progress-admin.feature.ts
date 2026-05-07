import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { ProgressAdminController } from './progress-admin.controller';

export const ProgressAdminFeature: AdminFeature = {
  resource: 'progress-management',
  controller: ProgressAdminController,
  permissions: ['read'],
  menu: {
    label: 'Progress',
    icon: 'chart-bar',
    order: 15,
  },
};
