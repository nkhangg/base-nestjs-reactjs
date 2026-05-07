import { randomUUID } from 'crypto';
import { ValueObject } from '../../../../shared/domain/value-object';

interface OrganizationIdProps {
  value: string;
}

export class OrganizationId extends ValueObject<OrganizationIdProps> {
  static create(): OrganizationId {
    return new OrganizationId({ value: randomUUID() });
  }

  static from(value: string): OrganizationId {
    return new OrganizationId({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
