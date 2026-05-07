import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ClassroomId } from '../value-objects/classroom-id.vo';

export interface ClassroomProps {
  orgId: string;
  teacherId: string;
  name: string;
  inviteCode: string;
  createdAt: Date;
}

export class Classroom extends BaseEntity<ClassroomId> {
  private props: ClassroomProps;

  private constructor(id: ClassroomId, props: ClassroomProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    orgId: string;
    teacherId: string;
    name: string;
    inviteCode: string;
  }): Classroom {
    return new Classroom(ClassroomId.create(), {
      orgId: params.orgId,
      teacherId: params.teacherId,
      name: params.name,
      inviteCode: params.inviteCode,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: ClassroomProps): Classroom {
    return new Classroom(ClassroomId.from(id), props);
  }

  rename(name: string): void {
    this.props.name = name;
  }

  get orgId(): string {
    return this.props.orgId;
  }
  get teacherId(): string {
    return this.props.teacherId;
  }
  get name(): string {
    return this.props.name;
  }
  get inviteCode(): string {
    return this.props.inviteCode;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
