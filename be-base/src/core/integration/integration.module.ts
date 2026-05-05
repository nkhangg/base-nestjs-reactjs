import { Module } from '@nestjs/common';
import { NotificationModule } from '../../modules/notification/notification.module';
import { OnUserCreatedHandler } from './handlers/on-user-created.handler';
import { OnUserDeactivatedHandler } from './handlers/on-user-deactivated.handler';
import { OnAdminCreatedHandler } from './handlers/on-admin-created.handler';
import { OnAdminDeactivatedHandler } from './handlers/on-admin-deactivated.handler';
import { OnFileUploadedHandler } from './handlers/on-file-uploaded.handler';
import { OnConfigChangedHandler } from './handlers/on-config-changed.handler';
import { OnBlogPostPublishedHandler } from './handlers/on-blog-post-published.handler';

@Module({
  imports: [NotificationModule],
  providers: [
    OnUserCreatedHandler,
    OnUserDeactivatedHandler,
    OnAdminCreatedHandler,
    OnAdminDeactivatedHandler,
    OnFileUploadedHandler,
    OnConfigChangedHandler,
    OnBlogPostPublishedHandler,
  ],
})
export class IntegrationModule {}
