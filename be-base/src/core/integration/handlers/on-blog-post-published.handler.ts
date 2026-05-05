import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { BlogPostPublishedEvent } from '../../../modules/blog/domain/events/blog-post-published.event';
import { SendNotificationUseCase } from '../../../modules/notification/application/use-cases/send-notification.use-case';

@Injectable()
export class OnBlogPostPublishedHandler {
  private readonly logger = new Logger(OnBlogPostPublishedHandler.name);

  constructor(private readonly sendNotification: SendNotificationUseCase) {}

  @OnEvent('blog.post_published')
  async handle(event: BlogPostPublishedEvent): Promise<void> {
    this.logger.log(`blog.post_published: "${event.title}" (${event.postId})`);
    await this.sendNotification.execute({
      targets: [{ kind: 'all-admins' }],
      title: 'Bài viết mới được publish',
      body: `"${event.title}" đã được publish`,
      type: 'info',
      senderType: 'system',
    });
  }
}
