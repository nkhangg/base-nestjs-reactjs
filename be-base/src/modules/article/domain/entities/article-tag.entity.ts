import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ArticleTagId } from '../value-objects/article-tag-id.vo';

export interface ArticleTagProps {
  name: string;
}

export class ArticleTag extends BaseEntity<ArticleTagId> {
  private props: ArticleTagProps;

  private constructor(id: ArticleTagId, props: ArticleTagProps) {
    super(id);
    this.props = props;
  }

  static create(name: string): ArticleTag {
    return new ArticleTag(ArticleTagId.create(), { name });
  }

  static reconstitute(id: string, props: ArticleTagProps): ArticleTag {
    return new ArticleTag(ArticleTagId.from(id), props);
  }

  get name(): string {
    return this.props.name;
  }
}
