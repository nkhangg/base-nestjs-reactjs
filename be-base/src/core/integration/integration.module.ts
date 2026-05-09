import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule } from '../../modules/notification/notification.module';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationProcessor } from './notification.processor';
import { OnUserCreatedHandler } from './handlers/on-user-created.handler';
import { OnUserDeactivatedHandler } from './handlers/on-user-deactivated.handler';
import { OnAdminCreatedHandler } from './handlers/on-admin-created.handler';
import { OnAdminDeactivatedHandler } from './handlers/on-admin-deactivated.handler';
import { OnFileUploadedHandler } from './handlers/on-file-uploaded.handler';
import { OnConfigChangedHandler } from './handlers/on-config-changed.handler';
import { OnBlogPostPublishedHandler } from './handlers/on-blog-post-published.handler';
import { OnContactSubmittedHandler } from './handlers/on-contact-submitted.handler';
import { OnContactRepliedHandler } from './handlers/on-contact-replied.handler';

@Module({
  imports: [
    NotificationModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATION }),
    BullModule.registerQueue({ name: QUEUE_NAMES.MAIL }),
  ],
  providers: [
    NotificationQueueService,
    NotificationProcessor,
    OnUserCreatedHandler,
    OnUserDeactivatedHandler,
    OnAdminCreatedHandler,
    OnAdminDeactivatedHandler,
    OnFileUploadedHandler,
    OnConfigChangedHandler,
    OnBlogPostPublishedHandler,
    OnContactSubmittedHandler,
    OnContactRepliedHandler,
  ],
})
export class IntegrationModule {}
