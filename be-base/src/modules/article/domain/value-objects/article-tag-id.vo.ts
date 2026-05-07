import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ArticleTagIdProps {
  value: string;
}

export class ArticleTagId extends ValueObject<ArticleTagIdProps> {
  static create(): ArticleTagId {
    return new ArticleTagId({ value: randomUUID() });
  }

  static from(value: string): ArticleTagId {
    return new ArticleTagId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
