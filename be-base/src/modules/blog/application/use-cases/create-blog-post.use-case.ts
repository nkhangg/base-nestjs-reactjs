import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { BlogPost, type BlogPostStatus } from '../../domain/entities/blog-post.entity';
import {
  BLOG_POST_REPOSITORY,
  type IBlogPostRepository,
} from '../../domain/repositories/blog-post.repository';
import { generateSlug } from '../../infrastructure/utils/slug.util';

export interface CreateBlogPostInput {
  title: string;
  slug?: string;
  content: string;
  contentType?: string;
  excerpt?: string;
  status?: BlogPostStatus;
  coverFileId?: string;
  categoryId?: string;
  tags?: string[];
  authorId?: string;
  metaTitle?: string;
  metaDesc?: string;
}

export type CreateBlogPostResult = Result<{ postId: string }, string>;

@Injectable()
export class CreateBlogPostUseCase {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly postRepo: IBlogPostRepository,
  ) {}

  async execute(input: CreateBlogPostInput): Promise<CreateBlogPostResult> {
    const slug = input.slug || generateSlug(input.title);

    const existing = await this.postRepo.findBySlug(slug);
    if (existing) return { ok: false, error: 'SLUG_EXISTS' };

    const post = BlogPost.create({
      slug,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      status: input.status,
      coverFileId: input.coverFileId,
      categoryId: input.categoryId,
      tags: input.tags,
      authorId: input.authorId,
      metaTitle: input.metaTitle,
      metaDesc: input.metaDesc,
    });

    await this.postRepo.save(post);
    return { ok: true, value: { postId: post.id.value } };
  }
}
