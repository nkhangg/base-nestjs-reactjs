import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ArticleIdProps {
  value: string;
}

export class ArticleId extends ValueObject<ArticleIdProps> {
  static create(): ArticleId {
    return new ArticleId({ value: randomUUID() });
  }

  static from(value: string): ArticleId {
    return new ArticleId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
