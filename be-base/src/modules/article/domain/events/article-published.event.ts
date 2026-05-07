import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ArticlePublishedEvent extends DomainEvent {
  readonly eventName = 'article.published';

  constructor(
    public readonly articleId: string,
    public readonly title: string,
    public readonly slug: string,
    public readonly publishedBy: string,
  ) {
    super();
  }
}
