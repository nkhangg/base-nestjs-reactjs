import { BaseEntity } from '../../../../shared/domain/base-entity';
import { BlogCategoryId } from '../value-objects/blog-category-id.vo';

export interface BlogCategoryProps {
  name: string;
  slug: string;
  description: string | null;
  coverFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogCategory extends BaseEntity<BlogCategoryId> {
  private props: BlogCategoryProps;

  private constructor(id: BlogCategoryId, props: BlogCategoryProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    name: string;
    slug: string;
    description?: string;
    coverFileId?: string;
  }): BlogCategory {
    const now = new Date();
    return new BlogCategory(BlogCategoryId.create(), {
      name: params.name,
      slug: params.slug,
      description: params.description ?? null,
      coverFileId: params.coverFileId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: BlogCategoryProps): BlogCategory {
    return new BlogCategory(BlogCategoryId.from(id), props);
  }

  update(params: {
    name?: string;
    slug?: string;
    description?: string | null;
    coverFileId?: string | null;
  }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.slug !== undefined) this.props.slug = params.slug;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.coverFileId !== undefined) this.props.coverFileId = params.coverFileId;
    this.props.updatedAt = new Date();
  }

  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | null { return this.props.description; }
  get coverFileId(): string | null { return this.props.coverFileId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
