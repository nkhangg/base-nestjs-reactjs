import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { NotificationAdminController } from './notification-admin.controller';

export const NotificationAdminFeature: AdminFeature = {
  resource: 'notification-management',
  controller: NotificationAdminController,
  permissions: ['read', 'create', 'delete'],
  menu: { label: 'Notifications', icon: 'bell', order: 7 },
};
