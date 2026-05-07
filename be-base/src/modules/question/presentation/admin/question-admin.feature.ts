import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { QuestionAdminController } from './question-admin.controller';

export const QuestionAdminFeature: AdminFeature = {
  resource: 'question-management',
  controller: QuestionAdminController,
  permissions: ['read', 'create', 'update', 'delete', 'approve'],
  menu: { label: 'Questions', icon: 'help-circle', order: 6 },
};
