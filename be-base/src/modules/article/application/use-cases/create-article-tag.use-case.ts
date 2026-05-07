import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_TAG_REPOSITORY,
  type IArticleTagRepository,
} from '../../domain/repositories/article-tag.repository';
import { ArticleTag } from '../../domain/entities/article-tag.entity';

export type CreateArticleTagResult = Result<{ tagId: string }, string>;

@Injectable()
export class CreateArticleTagUseCase {
  constructor(
    @Inject(ARTICLE_TAG_REPOSITORY)
    private readonly repo: IArticleTagRepository,
  ) {}

  async execute(name: string): Promise<CreateArticleTagResult> {
    const existing = await this.repo.findByName(name);
    if (existing) return { ok: false, error: 'TAG_EXISTS' };

    const tag = ArticleTag.create(name);
    await this.repo.save(tag);
    return { ok: true, value: { tagId: tag.id.value } };
  }
}
