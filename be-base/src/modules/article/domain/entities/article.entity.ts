import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ArticleId } from '../value-objects/article-id.vo';

export type ArticleStatus = 'pending' | 'approved' | 'rejected' | 'published';

export interface ArticleProps {
  title: string;
  slug: string;
  contentRaw: string;
  contentAnnotated: Record<string, unknown> | null;
  level: number | null;
  status: ArticleStatus;
  authorId: string | null;
  staffAuthorId: string | null;
  verifiedBy: string | null;
  categoryIds: string[];
  tagIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Article extends BaseEntity<ArticleId> {
  private props: ArticleProps;

  private constructor(id: ArticleId, props: ArticleProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
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
  }): Article {
    const now = new Date();
    return new Article(ArticleId.create(), {
      title: params.title,
      slug: params.slug,
      contentRaw: params.contentRaw,
      contentAnnotated: params.contentAnnotated ?? null,
      level: params.level ?? null,
      status: params.isStaff ? 'approved' : 'pending',
      authorId: params.authorId ?? null,
      staffAuthorId: params.staffAuthorId ?? null,
      verifiedBy: null,
      categoryIds: params.categoryIds ?? [],
      tagIds: params.tagIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: ArticleProps): Article {
    return new Article(ArticleId.from(id), props);
  }

  approve(adminId: string): void {
    this.props.status = 'approved';
    this.props.verifiedBy = adminId;
    this.props.updatedAt = new Date();
  }

  reject(adminId: string): void {
    this.props.status = 'rejected';
    this.props.verifiedBy = adminId;
    this.props.updatedAt = new Date();
  }

  publish(adminId: string): void {
    this.props.status = 'published';
    this.props.verifiedBy = adminId;
    this.props.updatedAt = new Date();
  }

  unpublish(): void {
    this.props.status = 'approved';
    this.props.updatedAt = new Date();
  }

  update(params: {
    title?: string;
    slug?: string;
    contentRaw?: string;
    contentAnnotated?: Record<string, unknown> | null;
    level?: number | null;
    categoryIds?: string[];
    tagIds?: string[];
  }): void {
    if (params.title !== undefined) this.props.title = params.title;
    if (params.slug !== undefined) this.props.slug = params.slug;
    if (params.contentRaw !== undefined)
      this.props.contentRaw = params.contentRaw;
    if (params.contentAnnotated !== undefined)
      this.props.contentAnnotated = params.contentAnnotated;
    if (params.level !== undefined) this.props.level = params.level;
    if (params.categoryIds !== undefined)
      this.props.categoryIds = params.categoryIds;
    if (params.tagIds !== undefined) this.props.tagIds = params.tagIds;
    this.props.updatedAt = new Date();
  }

  get title(): string {
    return this.props.title;
  }
  get slug(): string {
    return this.props.slug;
  }
  get contentRaw(): string {
    return this.props.contentRaw;
  }
  get contentAnnotated(): Record<string, unknown> | null {
    return this.props.contentAnnotated;
  }
  get level(): number | null {
    return this.props.level;
  }
  get status(): ArticleStatus {
    return this.props.status;
  }
  get authorId(): string | null {
    return this.props.authorId;
  }
  get staffAuthorId(): string | null {
    return this.props.staffAuthorId;
  }
  get verifiedBy(): string | null {
    return this.props.verifiedBy;
  }
  get categoryIds(): string[] {
    return this.props.categoryIds;
  }
  get tagIds(): string[] {
    return this.props.tagIds;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
