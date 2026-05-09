import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { ContactsAdminController } from './contacts-admin.controller';

export const ContactsAdminFeature: AdminFeature = {
  resource: 'contacts',
  controller: ContactsAdminController,
  permissions: ['read', 'update', 'delete'],
  menu: { label: 'Liên hệ', icon: 'mail', order: 8 },
};
