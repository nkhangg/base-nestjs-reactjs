import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { AdminOrganizationController } from './admin-organization.controller';

export const AdminOrganizationFeature: AdminFeature = {
  resource: 'organization-management',
  controller: AdminOrganizationController,
  permissions: ['read', 'delete'],
  menu: {
    label: 'Organizations',
    icon: 'building',
    order: 16,
  },
};
