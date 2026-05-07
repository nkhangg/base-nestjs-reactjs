import { BaseEntity } from '../../../../shared/domain/base-entity';
import { OrganizationId } from '../value-objects/organization-id.vo';

export interface OrganizationProps {
  name: string;
  ownerId: string;
  createdAt: Date;
}

export class Organization extends BaseEntity<OrganizationId> {
  private props: OrganizationProps;

  private constructor(id: OrganizationId, props: OrganizationProps) {
    super(id);
    this.props = props;
  }

  static create(params: { name: string; ownerId: string }): Organization {
    return new Organization(OrganizationId.create(), {
      name: params.name,
      ownerId: params.ownerId,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: OrganizationProps): Organization {
    return new Organization(OrganizationId.from(id), props);
  }

  rename(name: string): void {
    this.props.name = name;
  }

  get name(): string {
    return this.props.name;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
