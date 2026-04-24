import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface ConfigIdProps {
  value: string;
}

export class ConfigId extends ValueObject<ConfigIdProps> {
  static create(): ConfigId {
    return new ConfigId({ value: randomUUID() });
  }

  static from(value: string): ConfigId {
    return new ConfigId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
