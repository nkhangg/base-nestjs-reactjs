import { BaseEntity } from '../../../../shared/domain/base-entity';
import { randomUUID } from 'crypto';
import type { SubjectType } from '../value-objects/subject.vo';

interface RoleAssignmentProps {
  subjectId: string;
  subjectType: SubjectType;
  roleId: string;
  createdAt: Date;
}

export class RoleAssignment extends BaseEntity<string> {
  private props: RoleAssignmentProps;

  private constructor(id: string, props: RoleAssignmentProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    subjectId: string;
    subjectType: SubjectType;
    roleId: string;
  }): RoleAssignment {
    return new RoleAssignment(randomUUID(), {
      ...params,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: RoleAssignmentProps): RoleAssignment {
    return new RoleAssignment(id, props);
  }

  get subjectId(): string {
    return this.props.subjectId;
  }
  get subjectType(): SubjectType {
    return this.props.subjectType;
  }
  get roleId(): string {
    return this.props.roleId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
