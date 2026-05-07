import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ArticleCategoryId } from '../value-objects/article-category-id.vo';

export interface ArticleCategoryProps {
  name: string;
  slug: string;
  colorCode: string | null;
  iconUrl: string | null;
}

export class ArticleCategory extends BaseEntity<ArticleCategoryId> {
  private props: ArticleCategoryProps;

  private constructor(id: ArticleCategoryId, props: ArticleCategoryProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    name: string;
    slug: string;
    colorCode?: string;
    iconUrl?: string;
  }): ArticleCategory {
    return new ArticleCategory(ArticleCategoryId.create(), {
      name: params.name,
      slug: params.slug,
      colorCode: params.colorCode ?? null,
      iconUrl: params.iconUrl ?? null,
    });
  }

  static reconstitute(
    id: string,
    props: ArticleCategoryProps,
  ): ArticleCategory {
    return new ArticleCategory(ArticleCategoryId.from(id), props);
  }

  update(params: {
    name?: string;
    slug?: string;
    colorCode?: string | null;
    iconUrl?: string | null;
  }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.slug !== undefined) this.props.slug = params.slug;
    if (params.colorCode !== undefined) this.props.colorCode = params.colorCode;
    if (params.iconUrl !== undefined) this.props.iconUrl = params.iconUrl;
  }

  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get colorCode(): string | null {
    return this.props.colorCode;
  }
  get iconUrl(): string | null {
    return this.props.iconUrl;
  }
}
