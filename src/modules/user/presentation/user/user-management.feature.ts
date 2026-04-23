import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { UserManagementController } from './user-management.controller';

export const UserManagementFeature: AdminFeature = {
  resource: 'user-management',
  controller: UserManagementController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: {
    label: 'User Management',
    icon: 'users',
    order: 2,
  },
};
