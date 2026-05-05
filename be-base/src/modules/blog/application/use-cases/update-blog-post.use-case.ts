import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';
import type { BlogPostStatus } from '../../domain/entities/blog-post.entity';

export interface UpdateBlogPostInput {
  id: string;
  slug?: string;
  title?: string;
  content?: string;
  contentType?: string;
  excerpt?: string | null;
  status?: BlogPostStatus;
  coverFileId?: string | null;
  categoryId?: string | null;
  tags?: string[];
  metaTitle?: string | null;
  metaDesc?: string | null;
}

export type UpdateBlogPostResult = Result<void, string>;

@Injectable()
export class UpdateBlogPostUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
  ) {}

  async execute(input: UpdateBlogPostInput): Promise<UpdateBlogPostResult> {
    const post = await this.postRepo.findById(input.id);
    if (!post) return { ok: false, error: 'NOT_FOUND' };

    if (input.slug && input.slug !== post.slug) {
      const existing = await this.postRepo.findBySlug(input.slug);
      if (existing) return { ok: false, error: 'SLUG_EXISTS' };
    }

    post.update({
      slug: input.slug,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      status: input.status,
      coverFileId: input.coverFileId,
      categoryId: input.categoryId,
      tags: input.tags,
      metaTitle: input.metaTitle,
      metaDesc: input.metaDesc,
    });

    await this.postRepo.save(post);
    return { ok: true, value: undefined };
  }
}
