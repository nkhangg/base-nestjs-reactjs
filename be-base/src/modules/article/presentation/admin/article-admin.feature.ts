import type { AdminFeature } from '../../../../core/admin-shell/admin.interface';
import { ArticleAdminController } from './article-admin.controller';

export const ArticleAdminFeature: AdminFeature = {
  resource: 'article-management',
  controller: ArticleAdminController,
  permissions: ['read', 'create', 'update', 'delete', 'publish', 'approve'],
  menu: { label: 'Articles', icon: 'book-open', order: 4 },
};
