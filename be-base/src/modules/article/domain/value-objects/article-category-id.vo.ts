import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ArticleCategoryIdProps {
  value: string;
}

export class ArticleCategoryId extends ValueObject<ArticleCategoryIdProps> {
  static create(): ArticleCategoryId {
    return new ArticleCategoryId({ value: randomUUID() });
  }

  static from(value: string): ArticleCategoryId {
    return new ArticleCategoryId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
