export interface ClassroomMemberProps {
  classroomId: string;
  userId: string;
  joinedAt: Date;
}

export class ClassroomMember {
  private readonly props: ClassroomMemberProps;

  private constructor(props: ClassroomMemberProps) {
    this.props = props;
  }

  static create(params: {
    classroomId: string;
    userId: string;
  }): ClassroomMember {
    return new ClassroomMember({
      classroomId: params.classroomId,
      userId: params.userId,
      joinedAt: new Date(),
    });
  }

  static reconstitute(props: ClassroomMemberProps): ClassroomMember {
    return new ClassroomMember(props);
  }

  get classroomId(): string {
    return this.props.classroomId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get joinedAt(): Date {
    return this.props.joinedAt;
  }
}
