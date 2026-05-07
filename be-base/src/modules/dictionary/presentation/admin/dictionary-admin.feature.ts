import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { DictionaryAdminController } from './dictionary-admin.controller';

export const DictionaryAdminFeature: AdminFeature = {
  resource: 'dictionary-management',
  controller: DictionaryAdminController,
  permissions: ['read', 'create', 'update', 'delete', 'approve'],
  menu: {
    label: 'Dictionary',
    icon: 'book-open',
    order: 10,
  },
};
