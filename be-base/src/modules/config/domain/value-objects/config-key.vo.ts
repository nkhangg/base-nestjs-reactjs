import { ValueObject } from '../../../../shared/domain/value-object';

interface ConfigKeyProps {
  value: string;
}

const KEY_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/;
const MAX_LENGTH = 128;

export class ConfigKey extends ValueObject<ConfigKeyProps> {
  static create(value: string): ConfigKey {
    if (!value || value.length > MAX_LENGTH) {
      throw new Error(`ConfigKey must be 1–${MAX_LENGTH} characters`);
    }
    if (!KEY_PATTERN.test(value)) {
      throw new Error(
        `ConfigKey "${value}" is invalid. Use dot-notation: lowercase letters, digits, hyphens (e.g. homepage.hero)`,
      );
    }
    return new ConfigKey({ value });
  }

  static from(value: string): ConfigKey {
    return new ConfigKey({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
