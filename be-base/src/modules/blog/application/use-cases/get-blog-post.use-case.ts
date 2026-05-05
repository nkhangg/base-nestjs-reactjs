import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import type { BlogPost } from '../../domain/entities/blog-post.entity';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';

export type GetBlogPostResult = Result<BlogPost, string>;

@Injectable()
export class GetBlogPostUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
  ) {}

  async executeById(id: string): Promise<GetBlogPostResult> {
    const post = await this.postRepo.findById(id);
    if (!post) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: post };
  }

  async executeBySlug(slug: string): Promise<GetBlogPostResult> {
    const post = await this.postRepo.findBySlug(slug);
    if (!post) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: post };
  }
}
