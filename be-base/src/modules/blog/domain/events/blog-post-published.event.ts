import { DomainEvent } from '../../../../shared/domain/domain-event';

export class BlogPostPublishedEvent extends DomainEvent {
  readonly eventName = 'blog.post_published';

  constructor(
    public readonly postId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly authorId: string | null,
  ) {
    super();
  }
}
