import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { ConfigAdminController } from './config-admin.controller';

export const ConfigAdminFeature: AdminFeature = {
  resource: 'config-management',
  controller: ConfigAdminController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: {
    label: 'Config Management',
    icon: 'settings',
    order: 5,
  },
};
