import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ARTICLE_REPOSITORY,
  type IArticleRepository,
} from '../../domain/repositories/article.repository';
import { Article } from '../../domain/entities/article.entity';

export interface CreateArticleInput {
  title: string;
  slug: string;
  contentRaw: string;
  contentAnnotated?: Record<string, unknown>;
  level?: number;
  authorId?: string;
  staffAuthorId?: string;
  categoryIds?: string[];
  tagIds?: string[];
  isStaff?: boolean;
}

export type CreateArticleResult = Result<{ articleId: string }, string>;

@Injectable()
export class CreateArticleUseCase {
  constructor(
    @Inject(ARTICLE_REPOSITORY)
    private readonly repo: IArticleRepository,
  ) {}

  async execute(input: CreateArticleInput): Promise<CreateArticleResult> {
    const existing = await this.repo.findBySlug(input.slug);
    if (existing) return { ok: false, error: 'SLUG_TAKEN' };

    const article = Article.create(input);
    await this.repo.save(article);
    return { ok: true, value: { articleId: article.id.value } };
  }
}
