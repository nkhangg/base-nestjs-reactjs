import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';

export interface UpdateArticleInput {
  id: string;
  title?: string;
  slug?: string;
  contentRaw?: string;
  contentAnnotated?: Record<string, unknown> | null;
  level?: number | null;
  categoryIds?: string[];
  tagIds?: string[];
}

export type UpdateArticleResult = Result<void, string>;

@Injectable()
export class UpdateArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(input: UpdateArticleInput): Promise<UpdateArticleResult> {
    const article = await this.repo.findById(input.id);
    if (!article) return { ok: false, error: 'NOT_FOUND' };

    if (input.slug && input.slug !== article.slug) {
      const existing = await this.repo.findBySlug(input.slug);
      if (existing) return { ok: false, error: 'SLUG_TAKEN' };
    }

    article.update(input);
    await this.repo.save(article);
    return { ok: true, value: undefined };
  }
}
