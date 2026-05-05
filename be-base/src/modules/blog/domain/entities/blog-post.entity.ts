import { BaseEntity } from '../../../../shared/domain/base-entity';
import { BlogPostId } from '../value-objects/blog-post-id.vo';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPostProps {
  slug: string;
  title: string;
  content: string;
  contentType: string;
  excerpt: string | null;
  status: BlogPostStatus;
  coverFileId: string | null;
  categoryId: string | null;
  tags: string[];
  authorId: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogPost extends BaseEntity<BlogPostId> {
  private props: BlogPostProps;

  private constructor(id: BlogPostId, props: BlogPostProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    slug: string;
    title: string;
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
  }): BlogPost {
    const now = new Date();
    const status = params.status ?? 'draft';
    return new BlogPost(BlogPostId.create(), {
      slug: params.slug,
      title: params.title,
      content: params.content,
      contentType: params.contentType ?? 'markdown',
      excerpt: params.excerpt ?? null,
      status,
      coverFileId: params.coverFileId ?? null,
      categoryId: params.categoryId ?? null,
      tags: params.tags ?? [],
      authorId: params.authorId ?? null,
      metaTitle: params.metaTitle ?? null,
      metaDesc: params.metaDesc ?? null,
      publishedAt: status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: BlogPostProps): BlogPost {
    return new BlogPost(BlogPostId.from(id), props);
  }

  publish(): void {
    this.props.status = 'published';
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  unpublish(): void {
    this.props.status = 'draft';
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.status = 'archived';
    this.props.updatedAt = new Date();
  }

  update(params: {
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
  }): void {
    if (params.slug !== undefined) this.props.slug = params.slug;
    if (params.title !== undefined) this.props.title = params.title;
    if (params.content !== undefined) this.props.content = params.content;
    if (params.contentType !== undefined) this.props.contentType = params.contentType;
    if (params.excerpt !== undefined) this.props.excerpt = params.excerpt;
    if (params.status !== undefined) {
      if (params.status === 'published' && this.props.publishedAt === null) {
        this.props.publishedAt = new Date();
      }
      this.props.status = params.status;
    }
    if (params.coverFileId !== undefined) this.props.coverFileId = params.coverFileId;
    if (params.categoryId !== undefined) this.props.categoryId = params.categoryId;
    if (params.tags !== undefined) this.props.tags = params.tags;
    if (params.metaTitle !== undefined) this.props.metaTitle = params.metaTitle;
    if (params.metaDesc !== undefined) this.props.metaDesc = params.metaDesc;
    this.props.updatedAt = new Date();
  }

  get slug(): string { return this.props.slug; }
  get title(): string { return this.props.title; }
  get content(): string { return this.props.content; }
  get contentType(): string { return this.props.contentType; }
  get excerpt(): string | null { return this.props.excerpt; }
  get status(): BlogPostStatus { return this.props.status; }
  get coverFileId(): string | null { return this.props.coverFileId; }
  get categoryId(): string | null { return this.props.categoryId; }
  get tags(): string[] { return this.props.tags; }
  get authorId(): string | null { return this.props.authorId; }
  get metaTitle(): string | null { return this.props.metaTitle; }
  get metaDesc(): string | null { return this.props.metaDesc; }
  get publishedAt(): Date | null { return this.props.publishedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
