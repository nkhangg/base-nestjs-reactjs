import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface QuestionIdProps {
  value: string;
}

export class QuestionId extends ValueObject<QuestionIdProps> {
  static create(): QuestionId {
    return new QuestionId({ value: randomUUID() });
  }

  static from(value: string): QuestionId {
    return new QuestionId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
