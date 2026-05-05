import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface BlogCategoryIdProps {
  value: string;
}

export class BlogCategoryId extends ValueObject<BlogCategoryIdProps> {
  static create(): BlogCategoryId {
    return new BlogCategoryId({ value: randomUUID() });
  }

  static from(value: string): BlogCategoryId {
    return new BlogCategoryId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
