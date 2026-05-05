import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';

export type DeleteBlogPostResult = Result<void, string>;

@Injectable()
export class DeleteBlogPostUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
  ) {}

  async execute(id: string): Promise<DeleteBlogPostResult> {
    const post = await this.postRepo.findById(id);
    if (!post) return { ok: false, error: 'NOT_FOUND' };

    await this.postRepo.delete(id);
    return { ok: true, value: undefined };
  }
}
