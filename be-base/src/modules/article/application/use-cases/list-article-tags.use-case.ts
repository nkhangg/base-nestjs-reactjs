import { Inject, Injectable } from '@nestjs/common';
import {
  ARTICLE_TAG_REPOSITORY,
  type IArticleTagRepository,
} from '../../domain/repositories/article-tag.repository';
import type { ArticleTag } from '../../domain/entities/article-tag.entity';

@Injectable()
export class ListArticleTagsUseCase {
  constructor(
    @Inject(ARTICLE_TAG_REPOSITORY)
    private readonly repo: IArticleTagRepository,
  ) {}

  async execute(): Promise<ArticleTag[]> {
    return this.repo.list();
  }
}
