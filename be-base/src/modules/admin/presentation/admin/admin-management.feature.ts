import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { AdminManagementController } from './admin-management.controller';

export const AdminManagementFeature: AdminFeature = {
  resource: 'admin-management',
  controller: AdminManagementController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: {
    label: 'Admin Management',
    icon: 'shield',
    order: 1,
  },
};
