import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';

export type DeleteArticleResult = Result<void, string>;

@Injectable()
export class DeleteArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(id: string): Promise<DeleteArticleResult> {
    const article = await this.repo.findById(id);
    if (!article) return { ok: false, error: 'NOT_FOUND' };

    await this.repo.delete(id);
    return { ok: true, value: undefined };
  }
}
