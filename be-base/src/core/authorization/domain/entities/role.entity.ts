import { BaseEntity } from '../../../../shared/domain/base-entity';
import { randomUUID } from 'crypto';
import type { SubjectType } from '../value-objects/subject.vo';

interface RoleProps {
  name: string;
  description?: string;
  parentId?: string;
  subjectType: SubjectType;
}

export class Role extends BaseEntity<string> {
  private props: RoleProps;

  private constructor(id: string, props: RoleProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    name: string;
    subjectType: SubjectType;
    description?: string;
    parentId?: string;
  }): Role {
    return new Role(randomUUID(), {
      name: params.name,
      subjectType: params.subjectType,
      description: params.description,
      parentId: params.parentId,
    });
  }

  static reconstitute(id: string, props: RoleProps): Role {
    return new Role(id, props);
  }

  updateDescription(description: string): void {
    this.props.description = description;
  }

  setParent(parentId: string | undefined): void {
    this.props.parentId = parentId;
  }

  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get parentId(): string | undefined {
    return this.props.parentId;
  }
  get subjectType(): SubjectType {
    return this.props.subjectType;
  }
}
