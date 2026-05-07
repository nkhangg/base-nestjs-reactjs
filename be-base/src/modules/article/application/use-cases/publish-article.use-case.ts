import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events';
import { ArticlePublishedEvent } from '../../domain/events/article-published.event';

export type PublishArticleResult = Result<void, string>;

@Injectable()
export class PublishArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(id: string, adminId: string): Promise<PublishArticleResult> {
    const article = await this.repo.findById(id);
    if (!article) return { ok: false, error: 'NOT_FOUND' };

    if (article.status !== 'approved') {
      return { ok: false, error: 'ARTICLE_NOT_APPROVED' };
    }

    article.publish(adminId);
    await this.repo.save(article);

    this.eventBus.publish(
      new ArticlePublishedEvent(
        article.id.value,
        article.title,
        article.slug,
        adminId,
      ),
    );

    return { ok: true, value: undefined };
  }
}
