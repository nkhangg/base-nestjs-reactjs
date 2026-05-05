import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { MediaAdminController } from './media-admin.controller';

export const MediaAdminFeature: AdminFeature = {
  resource: 'media-management',
  controller: MediaAdminController,
  permissions: ['read', 'create', 'update', 'delete'],
  menu: {
    label: 'Media Library',
    icon: 'image',
    order: 6,
  },
};
