import { Inject, Injectable } from '@nestjs/common';
import type { BlogPost } from '../../domain/entities/blog-post.entity';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
  type FindAllPostsOptions,
} from '../../domain/repositories/blog-post.repository';

export type ListBlogPostsResult = { data: BlogPost[]; total: number };

@Injectable()
export class ListBlogPostsUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
  ) {}

  async execute(opts: FindAllPostsOptions): Promise<ListBlogPostsResult> {
    return this.postRepo.findAll(opts);
  }
}
