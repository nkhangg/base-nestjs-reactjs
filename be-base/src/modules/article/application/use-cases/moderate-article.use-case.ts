import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';

export interface ModerateArticleInput {
  id: string;
  action: 'approve' | 'reject';
  adminId: string;
}

export type ModerateArticleResult = Result<void, string>;

@Injectable()
export class ModerateArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(input: ModerateArticleInput): Promise<ModerateArticleResult> {
    const article = await this.repo.findById(input.id);
    if (!article) return { ok: false, error: 'NOT_FOUND' };

    if (input.action === 'approve') {
      article.approve(input.adminId);
    } else {
      article.reject(input.adminId);
    }

    await this.repo.save(article);
    return { ok: true, value: undefined };
  }
}
