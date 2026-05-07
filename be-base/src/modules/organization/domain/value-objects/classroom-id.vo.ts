import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ClassroomIdProps {
  value: string;
}

export class ClassroomId extends ValueObject<ClassroomIdProps> {
  static create(): ClassroomId {
    return new ClassroomId({ value: randomUUID() });
  }

  static from(value: string): ClassroomId {
    return new ClassroomId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
