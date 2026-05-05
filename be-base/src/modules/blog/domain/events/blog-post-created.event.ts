import { DomainEvent } from '../../../../shared/domain/domain-event';

export class BlogPostCreatedEvent extends DomainEvent {
  readonly eventName = 'blog.post_created';

  constructor(
    public readonly postId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly authorId: string | null,
  ) {
    super();
  }
}
