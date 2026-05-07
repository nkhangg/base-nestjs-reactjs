import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_TAG_REPOSITORY,
  type IArticleTagRepository,
} from '../../domain/repositories/article-tag.repository';

export type DeleteArticleTagResult = Result<void, string>;

@Injectable()
export class DeleteArticleTagUseCase {
  constructor(
    @Inject(ARTICLE_TAG_REPOSITORY)
    private readonly repo: IArticleTagRepository,
  ) {}

  async execute(id: string): Promise<DeleteArticleTagResult> {
    const tag = await this.repo.findById(id);
    if (!tag) return { ok: false, error: 'NOT_FOUND' };

    await this.repo.delete(id);
    return { ok: true, value: undefined };
  }
}
