import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events';
import { BlogPostPublishedEvent } from '../../domain/events/blog-post-published.event';

export type PublishBlogPostResult = Result<void, string>;

@Injectable()
export class PublishBlogPostUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(id: string): Promise<PublishBlogPostResult> {
    const post = await this.postRepo.findById(id);
    if (!post) return { ok: false, error: 'NOT_FOUND' };

    post.publish();
    await this.postRepo.save(post);

    this.eventBus.publish(
      new BlogPostPublishedEvent(post.id.value, post.title, post.slug, post.authorId),
    );

    return { ok: true, value: undefined };
  }
}
