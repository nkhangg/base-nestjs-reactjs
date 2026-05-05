import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';

export type UnpublishBlogPostResult = Result<void, string>;

@Injectable()
export class UnpublishBlogPostUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY)
    private readonly postRepo: IBlogPostRepository,
  ) {}

  async execute(id: string): Promise<UnpublishBlogPostResult> {
    const post = await this.postRepo.findById(id);
    if (!post) return { ok: false, error: 'NOT_FOUND' };

    post.unpublish();
    await this.postRepo.save(post);
    return { ok: true, value: undefined };
  }
}
