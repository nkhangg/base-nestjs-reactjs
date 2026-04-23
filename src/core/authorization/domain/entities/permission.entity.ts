import { BaseEntity } from '../../../../shared/domain/base-entity';
import { randomUUID } from 'crypto';
import type { Action } from '../value-objects/action.vo';

interface PermissionProps {
  roleId: string;
  resource: string; // '*' = all resources
  actions: Action[];
}

export class Permission extends BaseEntity<string> {
  private props: PermissionProps;

  private constructor(id: string, props: PermissionProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    roleId: string;
    resource: string;
    actions: Action[];
  }): Permission {
    return new Permission(randomUUID(), { ...params });
  }

  static reconstitute(id: string, props: PermissionProps): Permission {
    return new Permission(id, props);
  }

  get roleId(): string {
    return this.props.roleId;
  }
  get resource(): string {
    return this.props.resource;
  }
  get actions(): Action[] {
    return this.props.actions;
  }
}
