import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface BlogPostIdProps {
  value: string;
}

export class BlogPostId extends ValueObject<BlogPostIdProps> {
  static create(): BlogPostId {
    return new BlogPostId({ value: randomUUID() });
  }

  static from(value: string): BlogPostId {
    return new BlogPostId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
