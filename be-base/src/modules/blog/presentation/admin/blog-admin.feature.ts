import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { BlogAdminController } from './blog-admin.controller';

export const BlogAdminFeature: AdminFeature = {
  resource: 'blog-management',
  controller: BlogAdminController,
  permissions: ['read', 'create', 'update', 'delete', 'publish'],
  menu: {
    label: 'Blog',
    icon: 'file-text',
    order: 5,
  },
};
