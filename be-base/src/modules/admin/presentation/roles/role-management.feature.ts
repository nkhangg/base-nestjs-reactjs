import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { RoleManagementController } from './role-management.controller';

export const RoleManagementFeature: AdminFeature = {
  resource: 'role-management',
  controller: RoleManagementController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: {
    label: 'Role Management',
    icon: 'key',
    order: 2,
  },
};
